#include "main.h"
#include "usb_device.h"
#include "usbd_cdc_if.h"
#include <stdio.h>

/* Global */
SPI_HandleTypeDef hspi1;
uint32_t counter = 0;

/* Prototypes */
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_SPI1_Init(void);

/* SPI READ */
uint8_t spiRead(uint8_t reg)
{
    uint8_t tx[2] = { reg | 0x80, 0x00 };
    uint8_t rx[2] = { 0 };

    HAL_GPIO_WritePin(CS_I2C_SPI_GPIO_Port, CS_I2C_SPI_Pin, GPIO_PIN_RESET);
    HAL_SPI_TransmitReceive(&hspi1, tx, rx, 2, HAL_MAX_DELAY);
    HAL_GPIO_WritePin(CS_I2C_SPI_GPIO_Port, CS_I2C_SPI_Pin, GPIO_PIN_SET);

    return rx[1];
}

/* SPI WRITE */
void spiWrite(uint8_t reg, uint8_t val)
{
    uint8_t tx[2] = { reg & 0x7F, val };

    HAL_GPIO_WritePin(CS_I2C_SPI_GPIO_Port, CS_I2C_SPI_Pin, GPIO_PIN_RESET);
    HAL_SPI_Transmit(&hspi1, tx, 2, HAL_MAX_DELAY);
    HAL_GPIO_WritePin(CS_I2C_SPI_GPIO_Port, CS_I2C_SPI_Pin, GPIO_PIN_SET);
}

/* INIT L3GD20 */
void initL3GD20(void)
{
    uint8_t who = spiRead(0x0F); // WHO_AM_I

    if (who != 0xD4 && who != 0xD3)
    {
        HAL_GPIO_WritePin(LD6_GPIO_Port, LD6_Pin, GPIO_PIN_SET); // error LED
        while (1);
    }

    spiWrite(0x20, 0x0F); // CTRL_REG1: ON, XYZ enable, 95 Hz
    spiWrite(0x23, 0x00); // CTRL_REG4: 250 dps
}

/* READ + SEND */
void sendGyro(void)
{
    int8_t x = spiRead(0x29); // OUT_X
    int8_t y = spiRead(0x2B); // OUT_Y
    int8_t z = spiRead(0x2D); // OUT_Z

    char buf[64];
    int len = snprintf(buf, sizeof(buf),
        "%lu,%d,%d,%d\r\n",
        counter++, x, y, z);

    while (CDC_Transmit_FS((uint8_t*)buf, len) == USBD_BUSY)
        HAL_Delay(1);
}

void sendActivity(void)
{
    int8_t rx = spiRead(0x29);
    int8_t ry = spiRead(0x2B);
    int8_t rz = spiRead(0x2D);

    // surovi gyro (250 dps ≈ 8.75 mdps/LSB)
    float gx = rx * 0.00875f;
    float gy = ry * 0.00875f;
    float gz = rz * 0.00875f;

    // magnituda
    float activity = sqrtf(gx*gx + gy*gy + gz*gz);

    // low-pass filter
    static float activity_f = 0.0f;
    activity_f = 0.9f * activity_f + 0.1f * activity;

    // normalizacija
    float activity_norm = activity_f * 20.0f;
    if (activity_norm > 100) activity_norm = 100;

    char buf[64];
    int len = snprintf(buf, sizeof(buf),
        "%lu,%.1f\r\n", counter++, activity_norm);

    CDC_Transmit_FS((uint8_t*)buf, len);
}


/* MAIN */
int main(void)
{
    HAL_Init();
    SystemClock_Config();
    MX_GPIO_Init();
    MX_SPI1_Init();
    MX_USB_DEVICE_Init();

    HAL_Delay(3000); // USB stabilize

    __HAL_SPI_ENABLE(&hspi1);
    HAL_GPIO_WritePin(CS_I2C_SPI_GPIO_Port, CS_I2C_SPI_Pin, GPIO_PIN_SET);

    initL3GD20();

    while (1)
    {
        //sendGyro();
        sendActivity();
        HAL_Delay(50); // 20 Hz
    }
}



/* CLOCK */

void SystemClock_Config(void)
{
    RCC_OscInitTypeDef RCC_OscInitStruct = {0};
    RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};
    RCC_PeriphCLKInitTypeDef PeriphClkInit = {0};

    RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSI | RCC_OSCILLATORTYPE_HSE;
    RCC_OscInitStruct.HSEState = RCC_HSE_BYPASS;
    RCC_OscInitStruct.HSIState = RCC_HSI_ON;
    RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
    RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSE;
    RCC_OscInitStruct.PLL.PLLMUL = RCC_PLL_MUL6;
    HAL_RCC_OscConfig(&RCC_OscInitStruct);

    RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_SYSCLK | RCC_CLOCKTYPE_HCLK
                               | RCC_CLOCKTYPE_PCLK1 | RCC_CLOCKTYPE_PCLK2;
    RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
    RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
    RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV2;
    RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;
    HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_1);

    PeriphClkInit.PeriphClockSelection = RCC_PERIPHCLK_USB;
    PeriphClkInit.USBClockSelection = RCC_USBCLKSOURCE_PLL;
    HAL_RCCEx_PeriphCLKConfig(&PeriphClkInit);
}

/* SPI */

static void MX_SPI1_Init(void)
{
    hspi1.Instance = SPI1;
    hspi1.Init.Mode = SPI_MODE_MASTER;
    hspi1.Init.Direction = SPI_DIRECTION_2LINES;
    hspi1.Init.DataSize = SPI_DATASIZE_8BIT;
    hspi1.Init.CLKPolarity = SPI_POLARITY_HIGH;
    hspi1.Init.CLKPhase = SPI_PHASE_2EDGE;
    hspi1.Init.NSS = SPI_NSS_SOFT;
    hspi1.Init.BaudRatePrescaler = SPI_BAUDRATEPRESCALER_16; // počasneje!
    hspi1.Init.FirstBit = SPI_FIRSTBIT_MSB;
    HAL_SPI_Init(&hspi1);
}

/* GPIO */

static void MX_GPIO_Init(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    __HAL_RCC_GPIOE_CLK_ENABLE();
    __HAL_RCC_GPIOA_CLK_ENABLE();

    GPIO_InitStruct.Pin = CS_I2C_SPI_Pin;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_GPIO_Init(CS_I2C_SPI_GPIO_Port, &GPIO_InitStruct);

    GPIO_InitStruct.Pin = GPIO_PIN_5 | GPIO_PIN_6 | GPIO_PIN_7;
    GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
    GPIO_InitStruct.Alternate = GPIO_AF5_SPI1;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);
}

/* ERROR */

void Error_Handler(void)
{
    __disable_irq();
    while (1);
}
