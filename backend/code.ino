
#include <WiFi.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <TinyGPSPlus.h>

// LCD 16x2 à l'adresse I2C 0x27
LiquidCrystal_I2C lcd(0x27, 16, 2);
bool lcdPresent = false;

// GPS NEO-6M
TinyGPSPlus gps;
HardwareSerial gpsSerial(2);

// Pins I2C standards pour ESP32 DevKit V1
#define I2C_SDA 21
#define I2C_SCL 22

// Connexions
#define LED_OK 12
#define LED_ALERT 13

// --- CONFIGURATION D'IDENTIFICATION ---
const char* deviceId = "DJUA-KIN-000001";
const char* firmwareVersion = "2.0.0-HTTP";

// --- CONFIGURATION WIFI & HTTP/HTTPS ---
const char* ssid     = "dM"; // SSID du réseau WiFi de laboratoire
const char* password = "11111111";

// Serveur API (HTTP / HTTPS)
const char* httpEndpoint = "http://10.20.20.243:5000/api/iot/telemetry";
// Laisser vide en test local si IOT_AUTH_REQUIRED=false dans backend2/.env.
// Sinon renseigner la même valeur que IOT_API_KEY côté backend.
const char* iotApiKey = "";

// Simu des capteurs physiques requis
float solarVolt = 18.5;
float solarCurrent = 2.4;

float batVolt = 12.6;
float batCurrent = -2.1; // Négatif = décharge, Positif = charge

float dcLoadVolt = 12.1;
float dcLoadCurrent = 1.8;

float acVolt = 220.4;
float acCurrent = 0.85;

unsigned long prevMillis = 0;
const long interval = 10000; // Intervalle de télémétrie en millisecondes (10 secondes pour démo/test)
unsigned long lastPublishMillis = 0;

int page = 0;

void connectWiFi();
void sendTelemetry();

#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); // Désactiver le brownout detector
  Serial.begin(115200);
  
  // Initialisation I2C
  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setTimeOut(50);
  
  pinMode(LED_OK, OUTPUT);
  pinMode(LED_ALERT, OUTPUT);

  // Rapide test des leds au boot
  digitalWrite(LED_OK, HIGH);
  digitalWrite(LED_ALERT, HIGH);
  delay(300);
  digitalWrite(LED_OK, LOW);
  digitalWrite(LED_ALERT, LOW);

  // Détecter si le LCD est présent
  Wire.beginTransmission(0x27);
  if (Wire.endTransmission() == 0) {
    lcdPresent = true;
    lcd.init();
    lcd.backlight();
    lcd.clear();
    lcd.print("Djua HTTP SIM");
    delay(1500);
  } else {
    Serial.println("[I2C] Écran LCD non détecté à l'adresse 0x27.");
  }
  
  // Démarrer la communication avec le GPS
  gpsSerial.begin(9600, SERIAL_8N1, 16, 17);

  // Démarrer la connexion WiFi
  connectWiFi();
  lastPublishMillis = millis();
}

void loop() {
  // Lire les données du GPS en continu
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  // Vérifier la connexion WiFi
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastWiFiRetry = 0;
    if (millis() - lastWiFiRetry > 10000) {
      lastWiFiRetry = millis();
      Serial.print("[WiFi] Non connecté. Reconnexion à ");
      Serial.println(ssid);
      WiFi.begin(ssid, password);
    }
  }

  unsigned long currentMillis = millis();

  // Mise à jour de la simulation et envoi des données périodiques
  if (currentMillis - prevMillis >= interval) {
    prevMillis = currentMillis;

    // Simulation de l'environnement (variations physiques réalistes)
    solarVolt = 18.0 + (sin(currentMillis / 10000.0) * 1.5);
    solarCurrent = 2.5 + (sin(currentMillis / 5000.0) * 0.5);
    if (solarVolt < 0) solarVolt = 0;
    if (solarCurrent < 0) solarCurrent = 0;

    batVolt = 12.0 + (cos(currentMillis / 12000.0) * 0.6);
    // Le courant batterie dépend de la production solaire moins les consommations (DC + AC simulé)
    float totalLoadPower = (dcLoadVolt * dcLoadCurrent) + (acVolt * acCurrent);
    float solarPower = solarVolt * solarCurrent;
    batCurrent = (solarPower - totalLoadPower) / batVolt;

    dcLoadVolt = 12.0 + (sin(currentMillis / 8000.0) * 0.2);
    dcLoadCurrent = 1.5 + (cos(currentMillis / 4000.0) * 0.3);
    if (dcLoadCurrent < 0) dcLoadCurrent = 0;

    acVolt = 220.0 + (sin(currentMillis / 20000.0) * 4.0);
    acCurrent = 0.8 + (cos(currentMillis / 6000.0) * 0.15);
    if (acCurrent < 0) acCurrent = 0;

    // Envoi de la télémétrie sur le réseau
    sendTelemetry();

    // Affichage LCD
    if (lcdPresent) {
      lcd.clear();
      
      // Défilement des pages d'infos en mode normal
      switch (page) {
        case 0:
          lcd.setCursor(0, 0);
          lcd.print("Sol: "); lcd.print(solarVolt, 1); lcd.print("V "); lcd.print(solarCurrent, 2); lcd.print("A");
          lcd.setCursor(0, 1);
          lcd.print("Bat: "); lcd.print(batVolt, 1); lcd.print("V "); lcd.print(batCurrent, 2); lcd.print("A");
          break;

        case 1:
          lcd.setCursor(0, 0);
          lcd.print("DC Ld: "); lcd.print(dcLoadVolt, 1); lcd.print("V "); lcd.print(dcLoadCurrent, 2); lcd.print("A");
          lcd.setCursor(0, 1);
          lcd.print("AC Ld: "); lcd.print(acVolt, 1); lcd.print("V "); lcd.print(acCurrent, 2); lcd.print("A");
          break;

        case 2:
          lcd.setCursor(0, 0);
          lcd.print("GPS Lat: "); lcd.print(gps.location.isValid() ? gps.location.lat() : -4.3276, 4);
          lcd.setCursor(0, 1);
          lcd.print("GPS Lon: "); lcd.print(gps.location.isValid() ? gps.location.lng() : 15.3135, 4);
          break;
      }
      page = (page + 1) % 3;
    }

    // Gestion des leds de statut simple
    if (WiFi.status() == WL_CONNECTED) {
      digitalWrite(LED_OK, HIGH);
      digitalWrite(LED_ALERT, LOW);
    } else {
      digitalWrite(LED_OK, LOW);
      digitalWrite(LED_ALERT, HIGH);
    }

    // Sortie debug moniteur série
    Serial.println("--- Stats Djua (HTTP/HTTPS SIM) ---");
    Serial.print("Solaire: "); Serial.print(solarVolt); Serial.print("V / "); Serial.print(solarCurrent); Serial.println("A");
    Serial.print("Batterie: "); Serial.print(batVolt); Serial.print("V / "); Serial.print(batCurrent); Serial.println("A");
    Serial.print("DC Load: "); Serial.print(dcLoadVolt); Serial.print("V / "); Serial.print(dcLoadCurrent); Serial.println("A");
    Serial.print("AC Load: "); Serial.print(acVolt); Serial.print("V / "); Serial.print(acCurrent); Serial.println("A");
    if (gps.location.isValid()) {
      Serial.print("GPS: "); Serial.print(gps.location.lat(), 6); Serial.print(", "); Serial.println(gps.location.lng(), 6);
    } else {
      Serial.println("GPS: Pas de signal.");
    }
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

void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Envoi impossible : WiFi non connecté");
    return;
  }

  unsigned long currentMillis = millis();
  float deltaTimeSeconds = (currentMillis - lastPublishMillis) / 1000.0;
  if (deltaTimeSeconds <= 0.0) {
    deltaTimeSeconds = interval / 1000.0;
  }
  lastPublishMillis = currentMillis;

  // Calculs de puissance instantanée et d'énergie d'intervalle
  float solarPower = solarVolt * solarCurrent;
  float solarEnergyIntervalWh = (solarPower * deltaTimeSeconds) / 3600.0;

  float batteryPower = batVolt * batCurrent;

  float dcLoadPower = dcLoadVolt * dcLoadCurrent;
  float dcLoadEnergyIntervalWh = (dcLoadPower * deltaTimeSeconds) / 3600.0;

  float acApparentPowerVA = acVolt * acCurrent;
  float acEnergyIntervalVAh = (acApparentPowerVA * deltaTimeSeconds) / 3600.0;

  // Construction du JSON
  StaticJsonDocument<1024> doc;
  doc["kit_id"] = deviceId;
  
  // Coordonnées GPS
  if (gps.location.isValid()) {
    doc["latitude"] = gps.location.lat();
    doc["longitude"] = gps.location.lng();
  } else {
    doc["latitude"] = -4.3276;
    doc["longitude"] = 15.3135;
  }

  // Timestamp simulé
  char timeBuf[32];
  unsigned long s = millis() / 1000;
  snprintf(timeBuf, sizeof(timeBuf), "2026-08-27T16:%02d:%02dZ", (int)(s / 60) % 60, (int)s % 60);
  doc["timestamp"] = timeBuf;
  doc["interval_seconds"] = (int)deltaTimeSeconds;

  // Section Solar
  JsonObject solar = doc.createNestedObject("solar");
  solar["voltage_v"] = solarVolt;
  solar["current_a"] = solarCurrent;
  solar["power_w"] = solarPower;
  solar["energy_interval_wh"] = solarEnergyIntervalWh;

  // Section Battery
  JsonObject battery = doc.createNestedObject("battery");
  battery["voltage_v"] = batVolt;
  battery["current_a"] = batCurrent;
  battery["power_w"] = batteryPower;

  // Section DC Load
  JsonObject dc_load = doc.createNestedObject("dc_load");
  dc_load["voltage_v"] = dcLoadVolt;
  dc_load["current_a"] = dcLoadCurrent;
  dc_load["power_w"] = dcLoadPower;
  dc_load["energy_interval_wh"] = dcLoadEnergyIntervalWh;

  // Section AC Load
  JsonObject ac_load = doc.createNestedObject("ac_load");
  ac_load["voltage_v"] = acVolt;
  ac_load["current_a"] = acCurrent;
  ac_load["apparent_power_va"] = acApparentPowerVA;
  ac_load["energy_interval_vah"] = acEnergyIntervalVAh;

  String payload;
  serializeJson(doc, payload);

  Serial.print("[HTTP POST] Payload à envoyer : ");
  Serial.println(payload);

  // Envoi HTTP/HTTPS
  WiFiClient client;
  WiFiClientSecure secureClient;
  HTTPClient http;

  bool isHttps = String(httpEndpoint).startsWith("https://");
  bool beginSuccess = false;

  if (isHttps) {
    secureClient.setInsecure();
    beginSuccess = http.begin(secureClient, httpEndpoint);
  } else {
    beginSuccess = http.begin(client, httpEndpoint);
  }

  if (beginSuccess) {
    http.setTimeout(10000);
    http.addHeader("Content-Type", "application/json");
    if (strlen(iotApiKey) > 0) {
      http.addHeader("x-device-token", iotApiKey);
    }
    int httpResponseCode = http.POST(payload);
    
    if (httpResponseCode > 0) {
      Serial.print("[HTTP POST] Code réponse : ");
      Serial.println(httpResponseCode);
      String response = http.getString();
      Serial.print("[HTTP POST] Réponse serveur : ");
      Serial.println(response);
      if (httpResponseCode == HTTP_CODE_ACCEPTED) {
        Serial.println("[HTTP POST] Télémétrie acceptée par Djua.");
      }
    } else {
      Serial.print("[HTTP POST] Échec de la requête. Erreur : ");
      Serial.println(http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  } else {
    Serial.println("[HTTP POST] Connexion impossible au endpoint");
  }
}
