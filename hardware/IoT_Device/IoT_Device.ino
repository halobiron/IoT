#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <WiFiClientSecure.h>

#define DHT_PIN 21
#define DHT_TYPE DHT11
#define LIGHT_SENSOR_DO_PIN 4
const uint8_t LED_PINS[] = {23, 22, 18};
const size_t LED_COUNT = sizeof(LED_PINS) / sizeof(LED_PINS[0]);

const char *wifiSsid = "Redmi Note 13 Pro 5G";
const char *wifiPassword = "********";
const char *mqttServer = "2a2b78e5fa66468b9ff212a02f7c991d.s1.eu.hivemq.cloud";
const int mqttPort = 8883;
const char *mqttUsername = "TranHaiLong";
const char *mqttPassword = "B23DCCN510";
const char *mqttClientId = "ESP32_Long247";

const char *mqttDataTopic = "esp32/iot/data";
const char *mqttControlTopic = "esp32/iot/control";
const char *mqttActionHistoryTopic = "esp32/iot/action-history";

WiFiClientSecure secureWifiClient;
PubSubClient mqttClient(secureWifiClient);
DHT dhtSensor(DHT_PIN, DHT_TYPE);

bool ledStates[LED_COUNT] = {};

void publishLedStatus()
{
  if (!mqttClient.connected()) return;
  String payload;
  for (size_t i = 0; i < LED_COUNT; i++)
  {
    if (i > 0) payload += ',';
    payload += "led" + String(i + 1) + ':' + (ledStates[i] ? "on" : "off");
  }
  mqttClient.publish(mqttActionHistoryTopic, payload.c_str());
  Serial.print("Response: ");
  Serial.println(payload);
}

void setLedState(size_t index, bool isOn)
{
  ledStates[index] = isOn;
  digitalWrite(LED_PINS[index], isOn ? HIGH : LOW);
}

void setAllLedStates(bool isOn)
{
  for (size_t i = 0; i < LED_COUNT; i++) setLedState(i, isOn);
}

// Nhan all:on / all:off de dieu khien toan bo LED; van ho tro led1:on, led2:off.
bool handleMqttControl(String message)
{
  message.trim();
  message.toLowerCase();
  int start = 0;
  bool handled = false;

  while (start < message.length())
  {
    int end = message.indexOf(',', start);
    if (end < 0) end = message.length();
    String command = message.substring(start, end);
    command.trim();

    if (command == "all:on") { setAllLedStates(true); handled = true; }
    else if (command == "all:off") { setAllLedStates(false); handled = true; }
    else
    {
      int colon = command.indexOf(':');
      String ledName = colon < 0 ? "" : command.substring(0, colon);
      String requestedState = colon < 0 ? "" : command.substring(colon + 1);

      if (!ledName.startsWith("led") || (requestedState != "on" && requestedState != "off"))
      {
        mqttClient.publish(mqttActionHistoryTopic, "error: use all:on, all:off, or ledN:on/off");
        return false;
      }

      int ledNumber = ledName.substring(3).toInt();
      if (ledNumber < 1 || ledNumber > LED_COUNT)
      {
        mqttClient.publish(mqttActionHistoryTopic, "error: invalid LED number");
        return false;
      }

      setLedState(ledNumber - 1, requestedState == "on");
      handled = true;
    }
    start = end + 1;
  }
  return handled;
}

void mqttCallback(char *topic, byte *payload, unsigned int length)
{
  if (String(topic) != mqttControlTopic) return;

  String message;
  for (unsigned int i = 0; i < length; i++) message += (char)payload[i];
  Serial.print("Control received: ");
  Serial.println(message);

  if (handleMqttControl(message)) publishLedStatus();
}

void connectToMqtt()
{
  secureWifiClient.setInsecure();
  mqttClient.setServer(mqttServer, mqttPort);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setKeepAlive(60);

  int attempts = 0;
  while (!mqttClient.connected() && attempts < 3)
  {
    Serial.print("Connecting to MQTT...");
    if (mqttClient.connect(mqttClientId, mqttUsername, mqttPassword))
    {
      Serial.println("Connected");
      mqttClient.subscribe(mqttControlTopic);
      Serial.print("Subscribed to ");
      Serial.println(mqttControlTopic);
      publishLedStatus();
    }
    else
    {
      Serial.print("Failed, rc=");
      Serial.println(mqttClient.state());
      attempts++;
      delay(2000);
    }
  }
}

void setup()
{
  Serial.begin(115200);
  dhtSensor.begin();
  pinMode(LIGHT_SENSOR_DO_PIN, INPUT);
  for (size_t i = 0; i < LED_COUNT; i++)
  {
    pinMode(LED_PINS[i], OUTPUT);
    setLedState(i, false);
  }

  WiFi.begin(wifiSsid, wifiPassword);
  Serial.println("WiFi is connecting in the background.");
  mqttClient.setServer(mqttServer, mqttPort);
}

void loop()
{
  if (WiFi.status() == WL_CONNECTED && !mqttClient.connected()) connectToMqtt();
  if (mqttClient.connected()) mqttClient.loop();

  static unsigned long lastWifiRetry = 0;
  if (WiFi.status() != WL_CONNECTED && millis() - lastWifiRetry >= 10000)
  {
    lastWifiRetry = millis();
    WiFi.disconnect();
    WiFi.begin(wifiSsid, wifiPassword);
  }

  static unsigned long lastSensorRead = 0;
  if (millis() - lastSensorRead < 2000) return;
  lastSensorRead = millis();

  float humidity = dhtSensor.readHumidity();
  float temperature = dhtSensor.readTemperature();
  int light = digitalRead(LIGHT_SENSOR_DO_PIN) == LOW ? 100 : 0;
  if (isnan(humidity) || isnan(temperature))
  {
    Serial.println("Sensor error");
    return;
  }

  char data[128];
  snprintf(data, sizeof(data), "{\"temperature\":%.1f,\"humidity\":%.1f,\"light\":%d}", temperature, humidity, light);
  Serial.println(data);
  if (mqttClient.connected()) mqttClient.publish(mqttDataTopic, data);
}
