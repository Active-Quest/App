import cv2
import numpy as np
import struct
import os
from PIL import Image

class BitWriter:
    def __init__(self):
        self.buf = 0
        self.count = 0
        self.data = bytearray()

    def write_bit(self, b):
        self.buf = (self.buf << 1) | b
        self.count += 1
        if self.count == 8:
            self.data.append(self.buf)
            self.buf = 0
            self.count = 0

    def write_bits(self, value, n):
        for i in reversed(range(n)):
            self.write_bit((value >> i) & 1)

    def flush(self):
        if self.count > 0:
            self.buf <<= (8 - self.count)
            self.data.append(self.buf)
        return bytes(self.data)


class BitReader:
    def __init__(self, data):
        self.data = data
        self.i = 0
        self.buf = 0
        self.count = 0

    def read_bit(self):
        if self.count == 0:
            self.buf = self.data[self.i]
            self.i += 1
            self.count = 8
        b = (self.buf >> 7) & 1
        self.buf <<= 1
        self.count -= 1
        return b

    def read_bits(self, n):
        v = 0
        for _ in range(n):
            v = (v << 1) | self.read_bit()
        return v


def signed_to_unsigned(e):
    return 2 * e if e >= 0 else 2 * (-e) - 1

def unsigned_to_signed(n):
    return n // 2 if n % 2 == 0 else -(n // 2 + 1)

def jpeg_ls_predict(img, x, y):
    A = int(img[y, x-1]) if x > 0 else 0
    B = int(img[y-1, x]) if y > 0 else 0
    C = int(img[y-1, x-1]) if x > 0 and y > 0 else 0
    if C >= max(A, B): return min(A, B)
    if C <= min(A, B): return max(A, B)
    return A + B - C

def rice_encode(bw, k, v):
    q = v >> k
    r = v & ((1 << k) - 1)
    for _ in range(q):
        bw.write_bit(1)
    bw.write_bit(0)
    bw.write_bits(r, k)

def rice_decode(br, k):
    q = 0
    while br.read_bit() == 1:
        q += 1
    r = br.read_bits(k)
    return (q << k) | r


def compress_gray(img, out_file, k=1):
    img = img.astype(np.int32)
    H, W = img.shape

    bw = BitWriter()
    for y in range(H):
        for x in range(W):
            if y == 0 and x == 0:
                e = img[y, x]
            elif y == 0:
                e = img[y, x] - img[y, x-1]
            elif x == 0:
                e = img[y, x] - img[y-1, x]
            else:
                e = img[y, x] - jpeg_ls_predict(img, x, y)

            rice_encode(bw, k, signed_to_unsigned(e))

    data = bw.flush()
    with open(out_file, 'wb') as f:
        f.write(b'RICE')
        f.write(struct.pack('<HHB', H, W, k))
        f.write(data)

def decompress_gray(in_file, out_bmp):
    data = open(in_file, 'rb').read()
    assert data[:4] == b'RICE'
    H, W, k = struct.unpack('<HHB', data[4:9])
    br = BitReader(data[9:])

    img = np.zeros((H, W), dtype=np.int32)
    for y in range(H):
        for x in range(W):
            e = unsigned_to_signed(rice_decode(br, k))
            if y == 0 and x == 0:
                img[y, x] = e
            elif y == 0:
                img[y, x] = img[y, x-1] + e
            elif x == 0:
                img[y, x] = img[y-1, x] + e
            else:
                img[y, x] = jpeg_ls_predict(img, x, y) + e

    cv2.imwrite(out_bmp, np.clip(img, 0, 255).astype(np.uint8))

def compress_color(input_image, out_file):
    img = np.array(Image.open(input_image).convert("RGB"))
    H, W, _ = img.shape

    parts = []
    for ch in range(3):
        tmp = f'_ch{ch}.rice'
        compress_gray(img[:, :, ch], tmp)
        parts.append(tmp)

    with open(out_file, 'wb') as f:
        f.write(b'RICE_RGB')
        f.write(struct.pack('<HH', H, W))
        for p in parts:
            d = open(p, 'rb').read()
            f.write(struct.pack('<I', len(d)))
            f.write(d)
            os.remove(p)

def decompress_color(in_file, out_bmp):
    with open(in_file, 'rb') as f:
        assert f.read(8) == b'RICE_RGB'
        H, W = struct.unpack('<HH', f.read(4))

        chans = []
        for _ in range(3):
            size = struct.unpack('<I', f.read(4))[0]
            data = f.read(size)
            tmp = '_tmp.rice'
            open(tmp, 'wb').write(data)
            out = '_tmp.bmp'
            decompress_gray(tmp, out)
            chans.append(cv2.imread(out, 0))
            os.remove(tmp)
            os.remove(out)

    Image.fromarray(np.stack(chans, axis=-1), 'RGB').save(out_bmp)


if __name__ == "__main__":
    #TODO: preko argumenta dobi pot do slike ki jo kompresira in dolocit je treba se pot kam se shranjujejo 
    INPUT = "slike_BMP/slika.png"  
    COMP = "slika.rice"
    OUT = "slika_rec.bmp"

    compress_color(INPUT, COMP)
    decompress_color(COMP, OUT)

    orig = np.array(Image.open(INPUT).convert("RGB"))
    rec = np.array(Image.open(OUT).convert("RGB"))

    print("\n--- VERIFIKACIJA ---")
    print("Brezizgubnost:", np.array_equal(orig, rec))
    print("Original:", os.path.getsize(INPUT), "B")
    print("Stisnjeno:", os.path.getsize(COMP), "B")
