/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * STM32 -> TCP -> MongoDB (activities.avgSpeed[])
  ******************************************************************************
  */
/* USER CODE END Header */

#include "main.h"
#include <stdio.h>
#include <string.h>
#include <math.h>

/* HAL handles */
SPI_HandleTypeDef hspi1;
UART_HandleTypeDef huart1;

/* ===== USER CONFIG ===== */
#define ACTIVITY_BUF_SIZE 10
#define SEND_INTERVAL_MS 20000

/* ===== GLOBALS ===== */
uint32_t last_send_tick = 0;
uint32_t last_sample_tick = 0;

int activity_buf[ACTIVITY_BUF_SIZE];
uint8_t activity_count = 0;

char esp_payload[256];
int esp_payload_len;

/* ===== ESP STATE ===== */
typedef enum {
    ESP_WAIT_READY,
    ESP_WAIT_AT_OK,
    ESP_WAIT_CWMODE_OK,
    ESP_SEND_CWJAP,
    ESP_SEND_CIPSTART,
    ESP_WIFI_CONNECTED,
    ESP_WAIT_PROMPT,
    ESP_DATA_SENT
} esp_state_type;

esp_state_type esp_state = ESP_WAIT_READY;

/* ===== PROTOTYPES ===== */
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_SPI1_Init(void);
static void MX_USART1_UART_Init(void);

void ESP_Send_Command(const char *cmd);
void setup_esp_wifi(void);

uint8_t spiRead(uint8_t reg);
void spiWrite(uint8_t reg, uint8_t val);
void initL3GD20(void);
float readActivity(void);

/* ===== ESP SEND ===== */
void ESP_Send_Command(const char *cmd)
{
    HAL_UART_Transmit(&huart1, (uint8_t*)cmd, strlen(cmd), HAL_MAX_DELAY);
}

/* ===== SPI ===== */
uint8_t spiRead(uint8_t reg)
{
    uint8_t tx[2] = { reg | 0x80, 0x00 };
    uint8_t rx[2];

    HAL_GPIO_WritePin(CS_I2C_SPI_GPIO_Port, CS_I2C_SPI_Pin, GPIO_PIN_RESET);
    HAL_SPI_TransmitReceive(&hspi1, tx, rx, 2, HAL_MAX_DELAY);
    HAL_GPIO_WritePin(CS_I2C_SPI_GPIO_Port, CS_I2C_SPI_Pin, GPIO_PIN_SET);

    return rx[1];
}

void spiWrite(uint8_t reg, uint8_t val)
{
    uint8_t tx[2] = { reg & 0x7F, val };

    HAL_GPIO_WritePin(CS_I2C_SPI_GPIO_Port, CS_I2C_SPI_Pin, GPIO_PIN_RESET);
    HAL_SPI_Transmit(&hspi1, tx, 2, HAL_MAX_DELAY);
    HAL_GPIO_WritePin(CS_I2C_SPI_GPIO_Port, CS_I2C_SPI_Pin, GPIO_PIN_SET);
}

/* ===== SENSOR ===== */
void initL3GD20(void)
{
    if (spiRead(0x0F) != 0xD4) while (1);
    spiWrite(0x20, 0x0F);
    spiWrite(0x23, 0x00);
}

float readActivity(void)
{
    int16_t x = (spiRead(0x29) << 8) | spiRead(0x28);
    int16_t y = (spiRead(0x2B) << 8) | spiRead(0x2A);
    int16_t z = (spiRead(0x2D) << 8) | spiRead(0x2C);

    float gx = x * 0.00875f;
    float gy = y * 0.00875f;
    float gz = z * 0.00875f;

    return sqrtf(gx*gx + gy*gy + gz*gz);
}

/* ===== ESP RX STATE MACHINE ===== */
void setup_esp_wifi(void)
{
    static char rx[128];
    static uint8_t idx = 0;
    uint8_t c;

    if (HAL_UART_Receive(&huart1, &c, 1, 5) == HAL_OK)
    {
        if (idx < sizeof(rx)-1) rx[idx++] = c;

        if (c == '>')
        {
            if (esp_state == ESP_WAIT_PROMPT)
            {
                HAL_UART_Transmit(&huart1, (uint8_t*)esp_payload, esp_payload_len, HAL_MAX_DELAY);
                esp_state = ESP_DATA_SENT;
            }
            idx = 0;
        }

        if (c == '\n')
        {
            rx[idx] = 0;
            idx = 0;

            if (strstr(rx, "ready")) { ESP_Send_Command("AT\r\n"); esp_state = ESP_WAIT_AT_OK; }
            else if (strstr(rx, "OK") && esp_state == ESP_WAIT_AT_OK)
                ESP_Send_Command("AT+CWMODE=1\r\n");
            else if (strstr(rx, "OK") && esp_state == ESP_WAIT_CWMODE_OK)
                //ESP_Send_Command("AT+CWJAP=\"virus\",\"987654321\"\r\n");
            	ESP_Send_Command("AT+CWJAP=\"Bor's Iphone\",\"pwuyalj4vz5q\"\r\n");
            else if (strstr(rx, "WIFI GOT IP"))
              // ESP_Send_Command("AT+CIPSTART=\"TCP\",\"192.168.1.131\",1234\r\n");
            	ESP_Send_Command("AT+CIPSTART=\"TCP\",\"activequest.ddns.net\",1234\r\n");
            else if (strstr(rx, "CONNECT"))
                esp_state = ESP_WIFI_CONNECTED;
            else if (strstr(rx, "SEND OK"))
                esp_state = ESP_WIFI_CONNECTED;
        }
    }
}

/* ===== MAIN ===== */
int main(void)
{
    HAL_Init();
    SystemClock_Config();
    MX_GPIO_Init();
    MX_SPI1_Init();
    MX_USART1_UART_Init();

    initL3GD20();

    while (1)
    {
        setup_esp_wifi();

        /* sample every 1s */
        if (HAL_GetTick() - last_sample_tick > 1000)
        {
            if (activity_count < ACTIVITY_BUF_SIZE)
            {
                int scaled = (int)(readActivity() * 10);
                activity_buf[activity_count++] = scaled;
            }
            last_sample_tick = HAL_GetTick();
        }

        /* send every 20s */
        if (esp_state == ESP_WIFI_CONNECTED &&
            HAL_GetTick() - last_send_tick > SEND_INTERVAL_MS &&
            activity_count > 0)
        {
            char values[128] = "[";
            char tmp[12];

            for (uint8_t i = 0; i < activity_count; i++)
            {
                snprintf(tmp, sizeof(tmp), "%d", activity_buf[i]);
                strcat(values, tmp);
                if (i < activity_count - 1) strcat(values, ",");
            }
            strcat(values, "]");

            esp_payload_len = snprintf(
                esp_payload, sizeof(esp_payload),
                "{"
                "\"device\":\"stm32\","
                "\"sensor\":\"l3gd20\","
                "\"values\":%s"
                "}\r\n",
                values
            );

            char cmd[32];
            snprintf(cmd, sizeof(cmd), "AT+CIPSEND=%d\r\n", esp_payload_len);
            ESP_Send_Command(cmd);

            activity_count = 0;
            esp_state = ESP_WAIT_PROMPT;
            last_send_tick = HAL_GetTick();
        }
    }
}




/**
  * @brief System Clock Configuration
  * @retval None
  */
void SystemClock_Config(void)
{
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};
  RCC_PeriphCLKInitTypeDef PeriphClkInit = {0};

  /** Initializes the RCC Oscillators according to the specified parameters
  * in the RCC_OscInitTypeDef structure.
  */
  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSE;
  RCC_OscInitStruct.HSEState = RCC_HSE_BYPASS;
  RCC_OscInitStruct.HSEPredivValue = RCC_HSE_PREDIV_DIV1;
  RCC_OscInitStruct.HSIState = RCC_HSI_ON;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSE;
  RCC_OscInitStruct.PLL.PLLMUL = RCC_PLL_MUL6;
  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
  {
    Error_Handler();
  }

  /** Initializes the CPU, AHB and APB buses clocks
  */
  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                              |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV2;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_1) != HAL_OK)
  {
    Error_Handler();
  }
  PeriphClkInit.PeriphClockSelection = RCC_PERIPHCLK_USB|RCC_PERIPHCLK_USART1;
  PeriphClkInit.Usart1ClockSelection = RCC_USART1CLKSOURCE_PCLK2;
  PeriphClkInit.USBClockSelection = RCC_USBCLKSOURCE_PLL;
  if (HAL_RCCEx_PeriphCLKConfig(&PeriphClkInit) != HAL_OK)
  {
    Error_Handler();
  }
}

/**
  * @brief SPI1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_SPI1_Init(void)
{

  /* USER CODE BEGIN SPI1_Init 0 */

  /* USER CODE END SPI1_Init 0 */

  /* USER CODE BEGIN SPI1_Init 1 */

  /* USER CODE END SPI1_Init 1 */
  /* SPI1 parameter configuration*/
  hspi1.Instance = SPI1;
  hspi1.Init.Mode = SPI_MODE_MASTER;
  hspi1.Init.Direction = SPI_DIRECTION_2LINES;
  hspi1.Init.DataSize = SPI_DATASIZE_8BIT;	//<-----------------------------
  hspi1.Init.CLKPolarity = SPI_POLARITY_HIGH;
  hspi1.Init.CLKPhase    = SPI_PHASE_2EDGE;
  hspi1.Init.NSS = SPI_NSS_SOFT;
  hspi1.Init.BaudRatePrescaler = SPI_BAUDRATEPRESCALER_4;
  hspi1.Init.FirstBit = SPI_FIRSTBIT_MSB;
  hspi1.Init.TIMode = SPI_TIMODE_DISABLE;
  hspi1.Init.CRCCalculation = SPI_CRCCALCULATION_DISABLE;
  hspi1.Init.CRCPolynomial = 7;
  hspi1.Init.CRCLength = SPI_CRC_LENGTH_DATASIZE;
  hspi1.Init.NSSPMode = SPI_NSS_PULSE_ENABLE;
  if (HAL_SPI_Init(&hspi1) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN SPI1_Init 2 */

  /* USER CODE END SPI1_Init 2 */

}

/**
  * @brief USART1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_USART1_UART_Init(void)
{

  /* USER CODE BEGIN USART1_Init 0 */

  /* USER CODE END USART1_Init 0 */

  /* USER CODE BEGIN USART1_Init 1 */

  /* USER CODE END USART1_Init 1 */
  huart1.Instance = USART1;
  huart1.Init.BaudRate = 115200;
  huart1.Init.WordLength = UART_WORDLENGTH_8B;
  huart1.Init.StopBits = UART_STOPBITS_1;
  huart1.Init.Parity = UART_PARITY_NONE;
  huart1.Init.Mode = UART_MODE_TX_RX;
  huart1.Init.HwFlowCtl = UART_HWCONTROL_NONE;
  huart1.Init.OverSampling = UART_OVERSAMPLING_16;
  huart1.Init.OneBitSampling = UART_ONE_BIT_SAMPLE_DISABLE;
  huart1.AdvancedInit.AdvFeatureInit = UART_ADVFEATURE_NO_INIT;
  if (HAL_UART_Init(&huart1) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN USART1_Init 2 */

  /* USER CODE END USART1_Init 2 */

}

/**
  * @brief GPIO Initialization Function
  * @param None
  * @retval None
  */
static void MX_GPIO_Init(void)
{
  GPIO_InitTypeDef GPIO_InitStruct = {0};
  /* USER CODE BEGIN MX_GPIO_Init_1 */

  /* USER CODE END MX_GPIO_Init_1 */

  /* GPIO Ports Clock Enable */
  __HAL_RCC_GPIOE_CLK_ENABLE();
  __HAL_RCC_GPIOC_CLK_ENABLE();
  __HAL_RCC_GPIOF_CLK_ENABLE();
  __HAL_RCC_GPIOA_CLK_ENABLE();
  __HAL_RCC_GPIOB_CLK_ENABLE();

  /*Configure GPIO pin Output Level */
  HAL_GPIO_WritePin(GPIOE, CS_I2C_SPI_Pin|LD4_Pin|LD3_Pin|LD5_Pin
                          |LD7_Pin|LD9_Pin|LD10_Pin|LD8_Pin
                          |LD6_Pin, GPIO_PIN_RESET);

  /*Configure GPIO pins : DRDY_Pin MEMS_INT3_Pin MEMS_INT4_Pin MEMS_INT1_Pin
                           MEMS_INT2_Pin */
  GPIO_InitStruct.Pin = DRDY_Pin|MEMS_INT3_Pin|MEMS_INT4_Pin|MEMS_INT1_Pin
                          |MEMS_INT2_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_EVT_RISING;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(GPIOE, &GPIO_InitStruct);

  /*Configure GPIO pins : CS_I2C_SPI_Pin LD4_Pin LD3_Pin LD5_Pin
                           LD7_Pin LD9_Pin LD10_Pin LD8_Pin
                           LD6_Pin */
  GPIO_InitStruct.Pin = CS_I2C_SPI_Pin|LD4_Pin|LD3_Pin|LD5_Pin
                          |LD7_Pin|LD9_Pin|LD10_Pin|LD8_Pin
                          |LD6_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOE, &GPIO_InitStruct);

  /*Configure GPIO pin : B1_Pin */
  GPIO_InitStruct.Pin = B1_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(B1_GPIO_Port, &GPIO_InitStruct);

  /* USER CODE BEGIN MX_GPIO_Init_2 */

  /* USER CODE END MX_GPIO_Init_2 */
}

/* USER CODE BEGIN 4 */

/* USER CODE END 4 */

/**
  * @brief  This function is executed in case of error occurrence.
  * @retval None
  */
void Error_Handler(void)
{
  /* USER CODE BEGIN Error_Handler_Debug */
  /* User can add his own implementation to report the HAL error return state */
  __disable_irq();
  while (1)
  {
  }
  /* USER CODE END Error_Handler_Debug */
}
#ifdef USE_FULL_ASSERT
/**
  * @brief  Reports the name of the source file and the source line number
  *         where the assert_param error has occurred.
  * @param  file: pointer to the source file name
  * @param  line: assert_param error line source number
  * @retval None
  */
void assert_failed(uint8_t *file, uint32_t line)
{
  /* USER CODE BEGIN 6 */
  /* User can add his own implementation to report the file name and line number,
     ex: printf("Wrong parameters value: file %s on line %d\r\n", file, line) */
  /* USER CODE END 6 */
}
#endif /* USE_FULL_ASSERT */
