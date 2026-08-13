#include <WiFi.h>
#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>

// LCD 16x2 à l'adresse I2C 0x27
LiquidCrystal_I2C lcd(0x27, 16, 2);
bool lcdPresent = false;

// Pins I2C standards pour ESP32 DevKit V1 (SDA = GPIO 21, SCL = GPIO 22)
#define I2C_SDA 21
#define I2C_SCL 22

// Connexions
#define ONE_WIRE_BUS 4
#define LED_OK 12
#define LED_ALERT 13

// --- CONFIGURATION D'IDENTIFICATION ---
const char* deviceId = "DJUA-KIN-000001";
const char* firmwareVersion = "1.0.0-SIM";

// --- CONFIGURATION WIFI & MQTT ---
const char* ssid     = "dM"; // SSID du réseau WiFi de laboratoire
const char* password = "11111111";

const char* mqttServer = "10.20.20.184";
const int mqttPort     = 1883;
const char* mqttUser   = "djua_device";
const char* mqttPass   = "djua_pass_2026";

#define TOPIC_TELEMETRY "djua/%s/telemetry"
#define TOPIC_ALERTS    "djua/%s/alerts"
#define TOPIC_COMMANDS  "djua/%s/commands"
#define TOPIC_STATUS    "djua/%s/status"

// --- SIMULATION / MOCK MPU6050 ---
struct sensors_vec_t {
  float x;
  float y;
  float z;
};
struct sensors_event_t {
  sensors_vec_t acceleration;
};
class MockMPU6050 {
public:
  bool begin() {
    return true; // Simule une initialisation réussie
  }
  void getEvent(sensors_event_t* a, void* g, void* temp) {
    // Valeurs de repos : gravité sur Z (~9.8 m/s²), faibles bruits sur X et Y
    a->acceleration.x = (random(-100, 100) / 100.0) * 0.2;
    a->acceleration.y = (random(-100, 100) / 100.0) * 0.2;
    a->acceleration.z = 9.81 + (random(-100, 100) / 100.0) * 0.2;

    // Simulation périodique d'un choc (toutes les 40 secondes pendant 3 secondes)
    if ((millis() / 1000) % 40 < 3) {
      a->acceleration.x = 16.0;
      a->acceleration.y = 15.0;
      a->acceleration.z = 26.0;
    }
  }
};
MockMPU6050 mpu;

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

WiFiClient espClient;
PubSubClient mqtt(espClient);

// Simu des capteurs manquants
float solarVolt = 12.0;
float solarCurrent = 220.0;
float batVolt = 11.6;
float batCurrent = 140.0;
double gpsLat = -4.3276;
double gpsLon = 15.3135;
bool boxOpen = false;
bool isDeviceLocked = false;

unsigned long prevMillis = 0;
const long interval = 4000; // Fréquence de rafraîchissement LCD et envoi de télémétrie

unsigned long lastMqttRetry = 0;
int page = 0;

void connectWiFi();
void connectMQTT();
void publishTelemetry();
void publishStatus();
void publishAlert(const char* alertType, const char* details);
void handleCommand(char* topic, byte* payload, unsigned int length);

void setup() {
  Serial.begin(115200);
  
  // Initialisation I2C avec les pins spécifiques de l'ESP32-S3
  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setTimeOut(50); // Éviter le gel I2C indéfini si le bus est instable ou déconnecté
  
  pinMode(LED_OK, OUTPUT);
  pinMode(LED_ALERT, OUTPUT);

  // Rapide test des leds au boot
  digitalWrite(LED_OK, HIGH);
  digitalWrite(LED_ALERT, HIGH);
  delay(300);
  digitalWrite(LED_OK, LOW);
  digitalWrite(LED_ALERT, LOW);

  // Détecter si le LCD est physiquement présent avant d'appeler lcd.init()
  Wire.beginTransmission(0x27);
  if (Wire.endTransmission() == 0) {
    lcdPresent = true;
    lcd.init();
    lcd.backlight();
    lcd.clear();
    lcd.print("Djua Energy SIM");
    delay(1500);
  } else {
    Serial.println("[I2C] Écran LCD non détecté à l'adresse 0x27 (Optionnel en simulation).");
  }

  if (!mpu.begin()) {
    Serial.println("Erreur: MPU6050 non détecté");
    if (lcdPresent) {
      lcd.clear();
      lcd.print("Err: MPU6050");
    }
    digitalWrite(LED_ALERT, HIGH);
    // Utiliser delay() pour nourrir le watchdog de FreeRTOS et éviter un reboot cyclique rst:0x8
    while (1) {
      delay(500); 
    }
  }
  
  sensors.begin();

  // Configurer le serveur MQTT
  mqtt.setServer(mqttServer, mqttPort);
  mqtt.setCallback(handleCommand);
  
  // Démarrer la connexion WiFi
  connectWiFi();
}

void loop() {
  // Vérifier l'état de la connexion WiFi et MQTT
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqtt.connected()) {
      if (millis() - lastMqttRetry > 5000) {
        lastMqttRetry = millis();
        connectMQTT();
      }
    } else {
      mqtt.loop();
    }
  } else {
    // Si déconnecté, tenter de reconnecter toutes les 10 secondes de manière non-bloquante
    static unsigned long lastWiFiRetry = 0;
    if (millis() - lastWiFiRetry > 10000) {
      lastWiFiRetry = millis();
      Serial.print("[WiFi] Non connecté. Tentative de reconnexion à ");
      Serial.println(ssid);
      WiFi.begin(ssid, password);
    }
  }

  unsigned long currentMillis = millis();

  // Mise à jour de la simulation et envoi des données périodiques
  if (currentMillis - prevMillis >= interval) {
    prevMillis = currentMillis;

    // 1. Lecture des capteurs physiques dispo
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    sensors.requestTemperatures();
    float batTemp = sensors.getTempCByIndex(0);

    // 2. Simulation de l'environnement
    solarVolt = 12.0 + (sin(currentMillis / 8000.0) * 1.8);
    solarCurrent = 210.0 + (sin(currentMillis / 4000.0) * 60.0);
    if (solarVolt < 0) solarVolt = 0;

    batVolt = 11.6 + (cos(currentMillis / 10000.0) * 0.4);
    batCurrent = 130.0 + (sin(currentMillis / 6000.0) * 20.0);

    // Simu GPS Kinshasa
    gpsLat += 0.00002 * (random(-3, 4) / 10.0);
    gpsLon += 0.00002 * (random(-3, 4) / 10.0);

    // Simu ouverture boîtier (sabotage actif 5s toutes les 35s)
    bool prevBoxOpen = boxOpen;
    if ((currentMillis / 1000) % 35 < 5) {
      boxOpen = true;
    } else {
      boxOpen = false;
    }

    // Déclenchement d'alerte immédiate en cas de sabotage
    if (boxOpen && !prevBoxOpen) {
      publishAlert("enclosureOpened", "Boîtier ouvert détecté (simulé).");
    }

    // Seuil de choc simple sur l'accéléromètre réel
    bool choc = (abs(a.acceleration.x) > 14.0 || abs(a.acceleration.y) > 14.0 || abs(a.acceleration.z) > 22.0);
    if (choc) {
      publishAlert("vibration", "Secousse suspecte détectée.");
    }

    // 3. Gestion des leds de statut
    if (boxOpen || choc || isDeviceLocked) {
      digitalWrite(LED_ALERT, HIGH);
      digitalWrite(LED_OK, LOW);
    } else {
      digitalWrite(LED_ALERT, LOW);
      digitalWrite(LED_OK, HIGH);
    }

    // Envoi de la télémétrie sur le réseau
    publishTelemetry();

    // 4. Affichage LCD
    if (lcdPresent) {
      lcd.clear();
      
      if (isDeviceLocked) {
        lcd.setCursor(0, 0);
        lcd.print("SYSTEM VERROUILLE");
        lcd.setCursor(0, 1);
        lcd.print("Orange Energie");
      }
      else if (boxOpen) {
        lcd.setCursor(0, 0);
        lcd.print("ALERTE FRAUDE");
        lcd.setCursor(0, 1);
        lcd.print("Boitier ouvert!");
      } 
      else if (choc) {
        lcd.setCursor(0, 0);
        lcd.print("ALERTE SECOUSSE");
        lcd.setCursor(0, 1);
        lcd.print("Choc detecte!");
      } 
      else {
        // Défilement des pages d'infos en mode normal
        switch (page) {
          case 0:
            lcd.setCursor(0, 0);
            lcd.print("Sol: "); lcd.print(solarVolt, 1); lcd.print("V "); lcd.print((int)solarCurrent); lcd.print("mA");
            lcd.setCursor(0, 1);
            lcd.print("Bat: "); lcd.print(batVolt, 1); lcd.print("V "); lcd.print((int)batCurrent); lcd.print("mA");
            break;

          case 1:
            lcd.setCursor(0, 0);
            lcd.print("Temp Bat: "); lcd.print(batTemp, 1); lcd.print(" C");
            lcd.setCursor(0, 1);
            lcd.print("GPS: "); lcd.print(gpsLat, 4);
            break;

          case 2:
            lcd.setCursor(0, 0);
            lcd.print("Ax:"); lcd.print(a.acceleration.x, 1);
            lcd.print(" Ay:"); lcd.print(a.acceleration.y, 1);
            lcd.setCursor(0, 1);
            lcd.print("Az:"); lcd.print(a.acceleration.z, 1);
            break;
        }
        page = (page + 1) % 3;
      }
    }

    // Sortie debug moniteur série
    Serial.println("--- Stats Djua (SIM) ---");
    Serial.print("DS18B20: "); Serial.print(batTemp); Serial.println(" C");
    Serial.print("Solaire: "); Serial.print(solarVolt); Serial.print("V / "); Serial.print(solarCurrent); Serial.println("mA");
    Serial.print("Batterie: "); Serial.print(batVolt); Serial.print("V / "); Serial.print(batCurrent); Serial.println("mA");
    Serial.print("GPS: "); Serial.print(gpsLat, 6); Serial.print(", "); Serial.println(gpsLon, 6);
    Serial.print("WiFi Status: "); Serial.println(WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED");
    Serial.println("-----------------");
  }
}

void connectWiFi() {
  Serial.print("[WiFi] Connexion à : ");
  Serial.println(ssid);
  if (lcdPresent) {
    lcd.clear();
    lcd.print("WiFi Conn...");
  }
  
  WiFi.begin(ssid, password);
  
  int retryCount = 0;
  while (WiFi.status() != WL_CONNECTED && retryCount < 30) {
    delay(500);
    Serial.print(".");
    retryCount++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("[WiFi] Connecté avec succès !");
    Serial.print("[WiFi] Adresse IP : ");
    Serial.println(WiFi.localIP());
    if (lcdPresent) {
      lcd.clear();
      lcd.print("WiFi OK");
      lcd.setCursor(0, 1);
      lcd.print(WiFi.localIP().toString());
    }
    delay(1500);
  } else {
    Serial.println();
    Serial.println("[WiFi] Échec de la connexion (Timeout)");
    if (lcdPresent) {
      lcd.clear();
      lcd.print("WiFi Fail");
    }
    delay(1500);
  }
}

void connectMQTT() {
  char topicBuf[64];
  snprintf(topicBuf, sizeof(topicBuf), TOPIC_STATUS, deviceId);

  Serial.println("[MQTT] Connexion au broker...");
  if (mqtt.connect(deviceId, mqttUser, mqttPass, topicBuf, 1, true, "offline")) {
    Serial.println("[MQTT] Connecté !");
    
    char cmdTopic[64];
    snprintf(cmdTopic, sizeof(cmdTopic), TOPIC_COMMANDS, deviceId);
    mqtt.subscribe(cmdTopic);
    
    mqtt.publish(topicBuf, "online", true);
  } else {
    Serial.print("[MQTT] Échec de la connexion. État : ");
    Serial.println(mqtt.state());
  }
}

void publishTelemetry() {
  if (!mqtt.connected()) return;

  StaticJsonDocument<512> doc;
  doc["deviceId"] = deviceId;
  
  // Remplir un timestamp fictif ou NTP (ici calculé à partir de millis)
  char timeBuf[32];
  unsigned long s = millis() / 1000;
  snprintf(timeBuf, sizeof(timeBuf), "2026-08-01T15:%02d:%02dZ", (int)(s / 60) % 60, (int)s % 60);
  doc["timestamp"] = timeBuf;
  
  doc["batteryVoltage"] = batVolt;
  doc["batteryCurrent"] = batCurrent / 1000.0;
  doc["batterySOC"] = 82; // SOC simulé fixe pour le test
  
  sensors.requestTemperatures();
  doc["batteryTemperature"] = sensors.getTempCByIndex(0);
  
  doc["panelVoltage"] = solarVolt;
  doc["panelCurrent"] = solarCurrent / 1000.0;
  doc["panelPower"] = solarVolt * (solarCurrent / 1000.0);
  doc["latitude"] = gpsLat;
  doc["longitude"] = gpsLon;
  doc["speed"] = 0.0;
  doc["tamper"] = boxOpen;
  doc["firmwareVersion"] = firmwareVersion;

  String payload;
  serializeJson(doc, payload);

  char topic[64];
  snprintf(topic, sizeof(topic), TOPIC_TELEMETRY, deviceId);
  mqtt.publish(topic, payload.c_str());
  Serial.print("[MQTT SIM] Télémétrie envoyée : ");
  Serial.println(payload);
}

void publishAlert(const char* alertType, const char* details) {
  if (!mqtt.connected()) return;

  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["timestamp"] = "2026-08-01T15:00:00Z";
  doc["alertType"] = alertType;
  doc["details"] = details;
  doc["latitude"] = gpsLat;
  doc["longitude"] = gpsLon;

  String payload;
  serializeJson(doc, payload);

  char topic[64];
  snprintf(topic, sizeof(topic), TOPIC_ALERTS, deviceId);
  mqtt.publish(topic, payload.c_str());
  Serial.print("[MQTT SIM] ALERTE envoyée ! ");
  Serial.println(payload);
}

void handleCommand(char* topic, byte* payload, unsigned int length) {
  String cmdStr = "";
  for (unsigned int i = 0; i < length; i++) {
    cmdStr += (char)payload[i];
  }
  cmdStr.trim();

  Serial.print("[MQTT SIM CMD] Commande reçue : ");
  Serial.println(cmdStr);

  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, cmdStr) == DeserializationError::Ok) {
    const char* command = doc["command"];
    if (command != nullptr) {
      if (strcmp(command, "reboot") == 0) {
        ESP.restart();
      } 
      else if (strcmp(command, "lockDevice") == 0) {
        isDeviceLocked = true;
      } 
      else if (strcmp(command, "unlockDevice") == 0) {
        isDeviceLocked = false;
      }
    }
  }
}
