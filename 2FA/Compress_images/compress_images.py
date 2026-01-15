import cv2
import numpy as np
import struct
import math
import time
import os

class BitStream:
    def __init__(self, byte_data=b''):
        self.bits = ''.join(f'{b:08b}' for b in byte_data)
        self.read_index = 0
        self.write_buffer = ''
        self.pad = 0
    
    def write_bit(self, bit):
        self.write_buffer += str(bit)

    def write_bits(self, bits):
        self.write_buffer += bits

    def read_bits(self, count):
        if self.read_index + count > len(self.bits):
            raise EOFError("Premalo bitov za branje")
        result = self.bits[self.read_index:self.read_index + count]
        self.read_index += count
        return result
    
    def flush(self):
        s = self.write_buffer
        self.pad = (8 - len(s) % 8) % 8
        s += '0' * self.pad
        byte_data = bytes(int(s[i:i+8], 2) for i in range(0, len(s), 8))
        return byte_data, self.pad

def Encode(bitstream, g, value):
    if g > 0:
        bit_string = format(value, f'0{g}b')
        bitstream.write_bits(bit_string)

def Decode(bitstream, g):
    if g > 0:
        bits = bitstream.read_bits(g)
        return int(bits, 2)
    return 0

def signed_to_unsigned_N(epsilon):
    return 2 * epsilon if epsilon >= 0 else 2 * abs(epsilon) - 1

def unsigned_N_to_signed_E(N):
    return N // 2 if N % 2 == 0 else -(N // 2 + 1)

def jpeg_ls_predict(P, x, y):
    A = int(P[y, x-1]) if x > 0 else 0
    B = int(P[y-1, x]) if y > 0 else 0
    C = int(P[y-1, x-1]) if x > 0 and y > 0 else 0
    
    if C >= max(A, B):
        Pred = min(A, B)
    elif C <= min(A, B):
        Pred = max(A, B)
    else:
        Pred = A + B - C
    return Pred

def IC(bitstream, C, L, H):
    if H - L > 1:
        C_L, C_H = C[L], C[H]
        if C_H != C_L:
            m = (H + L) // 2
            g = math.ceil(math.log2(C_H - C_L + 1))
            Encode(bitstream, g, int(C[m] - C_L))
            if L < m: IC(bitstream, C, L, m)
            if m < H: IC(bitstream, C, m, H)

def DeIC(bitstream, C, L, H):
    if H - L > 1:
        C_L, C_H = C[L], C[H]
        if C_L == C_H:
            C[L+1:H] = C_L
        else:
            m = (H + L) // 2
            g = math.ceil(math.log2(C_H - C_L + 1))
            C[m] = C_L + Decode(bitstream, g)
            if L < m: DeIC(bitstream, C, L, m)
            if m < H: DeIC(bitstream, C, m, H)

def set_header(H, W, channels, C0_list, Cn_1_list, pad):
    header = b'FLoCIC'
    header += struct.pack('<HHB', H, W, channels) #Visina, sirina, kanali
    for i in range(channels):
        header += struct.pack('<II', int(C0_list[i]), int(Cn_1_list[i]))
    header += struct.pack('<B', pad)
    return header

def decode_header(data):
    if data[:6] != b'FLoCIC': raise ValueError("Invalid signature")
    H, W, channels = struct.unpack('<HHB', data[6:11])
    offset = 11
    C0_list, Cn_1_list = [], []
    for _ in range(channels):
        c0, cn1 = struct.unpack('<II', data[offset:offset+8])
        C0_list.append(c0)
        Cn_1_list.append(cn1)
        offset += 8
    pad = struct.unpack('<B', data[offset:offset+1])[0]
    return H, W, channels, C0_list, Cn_1_list, pad, data[offset+1:]

def compress_flocic(input_path, output_fcic):
    start_time = time.time()
    img = cv2.imread(input_path) #BGR!
    if img is None: raise FileNotFoundError(f"Ni mogoče naložiti {input_path}")
    
    H, W, channels = img.shape
    N_total = H * W
    bitstream = BitStream()
    C0_list, Cn_1_list = [], []

    for c in range(channels):
        channel_data = img[:, :, c]
        E = []
        for y in range(H):
            for x in range(W):
                P_val = int(channel_data[y, x])
                if y == 0 and x == 0: P_hat = 0
                elif y == 0: P_hat = int(channel_data[y, x-1])
                elif x == 0: P_hat = int(channel_data[y-1, x])
                else: P_hat = jpeg_ls_predict(channel_data, x, y)
                E.append(P_val - P_hat)

        N = [E[0]] + [signed_to_unsigned_N(e) for e in E[1:]]
        C = np.cumsum(N, dtype=np.int32)
        
        C0_list.append(C[0])
        Cn_1_list.append(C[-1])
        IC(bitstream, C, 0, N_total - 1)

    B_data, pad = bitstream.flush()
    B_header = set_header(H, W, channels, C0_list, Cn_1_list, pad)
    
    with open(output_fcic, 'wb') as f:
        f.write(B_header)
        f.write(B_data)

    print(f"Stisnjeno: {input_path} (Barvna, {channels} kanali) -> {output_fcic}")

def decompress_flocic(input_fcic, output_bmp):
    with open(input_fcic, 'rb') as f:
        data = f.read()

    H, W, channels, C0_list, Cn_1_list, pad, B_data = decode_header(data)
    bitstream = BitStream(B_data)
    N_total = H * W
    final_img = np.zeros((H, W, channels), dtype=np.uint8)

    for c in range(channels):
        C = np.zeros(N_total, dtype=np.int32)
        C[0], C[-1] = C0_list[c], Cn_1_list[c]
        DeIC(bitstream, C, 0, N_total - 1)

        N = np.zeros(N_total, dtype=np.int32)
        N[0] = C[0]
        N[1:] = C[1:] - C[:-1]

        channel_res = np.zeros((H, W), dtype=np.int32)
        for i in range(N_total):
            y, x = divmod(i, W)
            eps = N[i] if i == 0 else unsigned_N_to_signed_E(N[i])
            
            if y == 0 and x == 0: P_hat = 0
            elif y == 0: P_hat = int(channel_res[y, x-1])
            elif x == 0: P_hat = int(channel_res[y-1, x])
            else: P_hat = jpeg_ls_predict(channel_res, x, y)
            
            channel_res[y, x] = P_hat + eps
        
        final_img[:, :, c] = np.clip(channel_res, 0, 255)

    cv2.imwrite(output_bmp, final_img)
    print(f"Odstisnjeno: {output_bmp}")

#========= TOTI DEL SE IGNORIRA PRI NASI IMPLEMENTACIJI=========#
if __name__ == "__main__":
    INPUT = "slika.png" 
    COMPRESSED = "slika.fcic"
    RECONSTRUCTED = "slika_rekonstruirana.png"

    if os.path.exists(INPUT):
        compress_flocic(INPUT, COMPRESSED)
        decompress_flocic(COMPRESSED, RECONSTRUCTED)
        
        #TEST
        orig = cv2.imread(INPUT)
        recon = cv2.imread(RECONSTRUCTED)
        if orig is not None and recon is not None:
            diff = np.max(np.abs(orig.astype(int) - recon.astype(int)))
            print(f"razlika med slikami (0 je brezizgubna): {diff}")