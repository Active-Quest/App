/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.c
  * @brief          : Main program body
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2026 STMicroelectronics.
  * All rights reserved.
  *
  * This software is licensed under terms that can be found in the LICENSE file
  * in the root directory of this software component.
  * If no LICENSE file comes with this software, it is provided AS-IS.
  *
  ******************************************************************************
  */
/* USER CODE END Header */
/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include "usb_device.h"
#include "usbd_cdc_if.h"

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */

/* USER CODE END Includes */

/* Private typedef -----------------------------------------------------------*/
/* USER CODE BEGIN PTD */

/* USER CODE END PTD */

/* Private define ------------------------------------------------------------*/
/* USER CODE BEGIN PD */

/* USER CODE END PD */

/* Private macro -------------------------------------------------------------*/
/* USER CODE BEGIN PM */

/* USER CODE END PM */

/* Private variables ---------------------------------------------------------*/
SPI_HandleTypeDef hspi1;

UART_HandleTypeDef huart1;
UART_HandleTypeDef huart2;

typedef enum {
	ESP_WAIT_READY,
	ESP_SEND_AT,
	ESP_WAIT_AT_OK,
	ESP_SEND_ATE0,
	ESP_SEND_CWMODE,
	ESP_GOT_IP,
	ESP_ASSIGNED_SSID_AND_PASS,
	ESP_SEND_CIPMUX,
	ESP_SEND_CIPSERVER,
	ESP_SERVER_READY,
	ESP_WAIT_CWMODE3_OK,
	ESP_WAIT_CWJAP
}esp_state_type;

esp_state_type esp_state = ESP_WAIT_READY;

char saved_pass[64];
char saved_ssid[64];


/* USER CODE BEGIN PV */

/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_SPI1_Init(void);
static void MX_USART1_UART_Init(void);
static void MX_USART2_UART_Init(void);
void esp_send(const char *cmd);
void setup_esp_wifi(void);
void send_html(int link_id);
int parse_wifi_info(char *line, char *ssid, char *pass);
/* USER CODE BEGIN PFP */

/* USER CODE END PFP */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */
void esp_send(const char *cmd)
{
    HAL_UART_Transmit(&huart1,
                      (uint8_t*)cmd,
                      strlen(cmd),
                      HAL_MAX_DELAY);
}


void setup_esp_wifi(void)
{
    static char rx_line[256];
    static uint16_t idx = 0;
    uint8_t c;

    if (HAL_UART_Receive(&huart1, &c, 1, 5) == HAL_OK)
    {
        if (idx < sizeof(rx_line) - 1)
            rx_line[idx++] = c;

        if (c == '\n')
        {
            rx_line[idx] = 0;
            idx = 0;

            // debug izpis
            CDC_Transmit_FS((uint8_t*)rx_line, strlen(rx_line));

            //CE sn pripravljen mu poslem HTML kodo
            if (strstr(rx_line, "+IPD") && strstr(rx_line, "GET /?"))//NAJPREJ GET /?
            {
            	char ssid[64];
            	char pass[64];

            	//Ce je slo parsat wifi info
            	if(parse_wifi_info(rx_line,ssid,pass)){
            		//Najprej ga preklopim v AP+STA
            		esp_send("AT+CWMODE=3\r\n");

            		strcpy(saved_ssid,ssid);
            		strcpy(saved_pass,pass);


            		esp_state = ESP_WAIT_CWMODE3_OK;
            	}
            }else if(strstr(rx_line, "+IPD") && strstr(rx_line, "GET / ")){
            	int link_id = rx_line[5] - '0'; //daj iz char v int
        		send_html(link_id);
        	}

            //Premikam se po statih.. ko dobim odgovor grem na nasledni state
            if (strstr(rx_line, "ready") && esp_state == ESP_WAIT_READY)
            {
            	//Test
                esp_send("AT\r\n");
                esp_state = ESP_WAIT_AT_OK;
            }
            else if (strstr(rx_line, "OK") && esp_state == ESP_WAIT_AT_OK)
            {
            	//Da mi ne ponavla (ce testiras to mej v CoolTerm nastavleno local echo)
                esp_send("ATE0\r\n");
                esp_state = ESP_SEND_CWMODE;
            }
            else if (strstr(rx_line, "OK") && esp_state == ESP_SEND_CWMODE)
            {
            	//Nastavim Wifi mode v SoftAP mode (deluje kot wifi access point)
                esp_send("AT+CWMODE=3\r\n");
                esp_state = ESP_GOT_IP;
            }
            else if (strstr(rx_line, "OK") && esp_state == ESP_GOT_IP)
            {
            	//Dam mu neko ime in pass da se lahko povezem na njega
                esp_send("AT+CWSAP=\"ANDRAZ_ESP\",\"12345678\",5,3\r\n");
                esp_state = ESP_ASSIGNED_SSID_AND_PASS;
            }else if (strstr(rx_line, "OK") && esp_state == ESP_ASSIGNED_SSID_AND_PASS)
            {
            	//Dovolim vec povezav
                esp_send("AT+CIPMUX=1\r\n");
                esp_state = ESP_SEND_CIPMUX;
            }
            else if (strstr(rx_line, "OK") && esp_state == ESP_SEND_CIPMUX)
            {
            	//Naredim TCP server
                esp_send("AT+CIPSERVER=1,80\r\n");
                esp_state = ESP_SEND_CIPSERVER;
            }
            else if (strstr(rx_line, "OK") && esp_state == ESP_SEND_CIPSERVER)
            {
            	//ko je vse konec izpisem v terminal da je server ready
                esp_state = ESP_SERVER_READY;
                CDC_Transmit_FS((uint8_t*)"HTTP server ready\r\n", 19);
            }else if(strstr(rx_line, "OK") && esp_state == ESP_WAIT_CWMODE3_OK)
            {
            	char cmd[128];
            	//poslem ukaz da se ESP poveze na vnesen wifi
				sprintf(cmd, "AT+CWJAP=\"%s\",\"%s\"\r\n",saved_ssid,saved_pass);
				esp_send(cmd);
				esp_state = ESP_WAIT_CWJAP;
				//DEBUG ZA SSID IN PASSWORD PARSER
				uint8_t tx;

				tx = CDC_Transmit_FS((uint8_t*)saved_ssid, strlen(saved_ssid));
				HAL_Delay(5);

				tx = CDC_Transmit_FS((uint8_t*)"\r\n", 2);
				HAL_Delay(5);

				tx = CDC_Transmit_FS((uint8_t*)saved_pass, strlen(saved_pass));
				HAL_Delay(5);

				tx = CDC_Transmit_FS((uint8_t*)"\r\n", 2);
				HAL_Delay(5);
            }

        }
    }
}


void send_html(int link_id)
{
    const char html_page[] =
    "HTTP/1.1 200 OK\r\n"
    "Content-Type: text/html\r\n"
    "Connection: close\r\n"
    "\r\n"
    "<!DOCTYPE html>"
    "<html>"
    "<head><title>ESP32 WiFi Setup</title></head>"
    "<body>"
    "<h2>Wifi info</h2>"
    "<form action=\"/\" method=\"GET\">"
    "SSID:<br><input type=\"text\" name=\"ssid\"><br><br>"
    "Pass:<br><input type=\"password\" name=\"pass\"><br><br>"
    "<input type=\"submit\" value=\"Connect\">"
    "</form>"
    "</body>"
    "</html>";

    //POPRAVEK: zaprem kanal z istim id-jem ne pa vedno nultega
    char cmd[32];
    sprintf(cmd, "AT+CIPSEND=%d,%d\r\n",link_id, strlen(html_page));
    esp_send(cmd);
    HAL_Delay(50);
    esp_send(html_page);
    HAL_Delay(50);
    sprintf(cmd,"AT+CIPCLOSE=%d\r\n",link_id);
    esp_send(cmd);
}

int parse_wifi_info(char* line, char*ssid, char*pass){
	char *ssid_start = strstr(line,"ssid=");
	char *pass_start = strstr(line,"pass=");

	if(!ssid_start || !pass_start){
		return 0;
	}

	ssid_start += 5;//Preskocim "ssid="
	pass_start += 5;//Preskocim "pass="

	char *ssid_end = strchr(ssid_start,'&');//Tu lahko tak naredim ker je to vmes
	char *pass_end = strchr(pass_start,' ');//Tu pa grem do presledka ker je pol HTTP...

	if(!ssid_end || !pass_end){
		return 0;
	}

	memcpy(ssid,ssid_start,ssid_end - ssid_start);
	ssid[ssid_end - ssid_start] = 0;

	memcpy(pass,pass_start,pass_end - pass_start);
	pass[pass_end - pass_start] = 0;


	return 1;

}


/* USER CODE END 0 */

/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void)
{

  /* USER CODE BEGIN 1 */

  /* USER CODE END 1 */

  /* MCU Configuration--------------------------------------------------------*/

  /* Reset of all peripherals, Initializes the Flash interface and the Systick. */
  HAL_Init();

  /* USER CODE BEGIN Init */

  /* USER CODE END Init */

  /* Configure the system clock */
  SystemClock_Config();

  /* USER CODE BEGIN SysInit */

  /* USER CODE END SysInit */

  /* Initialize all configured peripherals */
  MX_GPIO_Init();
  MX_SPI1_Init();
  MX_USART1_UART_Init();
  MX_USART2_UART_Init();
  MX_USB_DEVICE_Init();
  /* USER CODE BEGIN 2 */
  char test_msg[] = "STM32 v zivo na CP2102!";
  uint8_t temp_byte;
  static uint8_t sending = 0;
  /* USER CODE END 2 */

  /* Infinite loop */
  /* USER CODE BEGIN WHILE */


  while (1)
  {
	  /*HAL_GPIO_TogglePin(GPIOE, GPIO_PIN_10);
	  //Ce je iz USB prisel ukaz ga poslji na ESP
	  if(cmd_ready && !sending){
		  sending = 1;
		  HAL_UART_Transmit(&huart1,cmd_buffer,cmd_len,HAL_MAX_DELAY);
		  cmd_len = 0;
		  cmd_ready = 0;
	  }

	  //Dobi odgovor od ESP
	  uint8_t esp_byte;
	  // Timeout mora biti majhen (npr. 1 ali 5ms), da zanka hitro kroži
	  if (HAL_UART_Receive(&huart1, &esp_byte, 1, 5) == HAL_OK)
	  {
		  CDC_Transmit_FS(&esp_byte, 1);

		  sending = 0;
	  }*/
	  setup_esp_wifi();



  }
  /* USER CODE END 3 */
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
  PeriphClkInit.PeriphClockSelection = RCC_PERIPHCLK_USB|RCC_PERIPHCLK_USART1
                              |RCC_PERIPHCLK_USART2;
  PeriphClkInit.Usart1ClockSelection = RCC_USART1CLKSOURCE_PCLK2;
  PeriphClkInit.Usart2ClockSelection = RCC_USART2CLKSOURCE_PCLK1;
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
  hspi1.Init.DataSize = SPI_DATASIZE_4BIT;
  hspi1.Init.CLKPolarity = SPI_POLARITY_LOW;
  hspi1.Init.CLKPhase = SPI_PHASE_1EDGE;
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
  * @brief USART2 Initialization Function
  * @param None
  * @retval None
  */
static void MX_USART2_UART_Init(void)
{

  /* USER CODE BEGIN USART2_Init 0 */

  /* USER CODE END USART2_Init 0 */

  /* USER CODE BEGIN USART2_Init 1 */

  /* USER CODE END USART2_Init 1 */
  huart2.Instance = USART2;
  huart2.Init.BaudRate = 115200;
  huart2.Init.WordLength = UART_WORDLENGTH_8B;
  huart2.Init.StopBits = UART_STOPBITS_1;
  huart2.Init.Parity = UART_PARITY_NONE;
  huart2.Init.Mode = UART_MODE_TX_RX;
  huart2.Init.HwFlowCtl = UART_HWCONTROL_NONE;
  huart2.Init.OverSampling = UART_OVERSAMPLING_16;
  huart2.Init.OneBitSampling = UART_ONE_BIT_SAMPLE_DISABLE;
  huart2.AdvancedInit.AdvFeatureInit = UART_ADVFEATURE_NO_INIT;
  if (HAL_UART_Init(&huart2) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN USART2_Init 2 */

  /* USER CODE END USART2_Init 2 */

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
