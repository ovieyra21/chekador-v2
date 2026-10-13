// Chekdor v2.0 - Daemon USB HID para Lector NFC NTAG213
// Reforma DOF 01/05/2026 Art. 132 Fracc. XXXIV - Prueba Plena Art. 805 LFT
// Emite marcajes append-only directamente a Supabase REST y canal Realtime
package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

// Configuración del Dispositivo y Supabase
type Config struct {
	DeviceID    string
	EmpresaID   string
	SupabaseURL string
	AnonKey     string
	SaltSecret  string
}

// Payload inmutable para la tabla public.marcajes
type MarcajeRecord struct {
	TrabajadorID string `json:"trabajador_id"`
	EmpresaID    string `json:"empresa_id"`
	TimestampUTC string `json:"timestamp_utc"`
	HashSHA256   string `json:"hash_sha256"`
	DispositivoID string `json:"dispositivo_id"`
}

// Función pura determinista para calcular SHA-256
// Concatenación: trabajador_id + timestamp + device_id + salt
func CalcularHashMarcaje(trabajadorID, timestampUTC, deviceID, salt string) string {
	data := fmt.Sprintf("%s%s%s%s", trabajadorID, timestampUTC, deviceID, salt)
	hasher := sha256.New()
	hasher.Write([]byte(data))
	return hex.EncodeToString(hasher.Sum(nil))
}

// Envío append-only a Supabase REST
func EmitirMarcaje(cfg Config, trabajadorID string) error {
	timestampUTC := time.Now().UTC().Format(time.RFC3339)
	salt := fmt.Sprintf("salt_%s_sec_%d", cfg.EmpresaID, time.Now().Unix())
	hashSha256 := CalcularHashMarcaje(trabajadorID, timestampUTC, cfg.DeviceID, salt)

	record := MarcajeRecord{
		TrabajadorID: trabajadorID,
		EmpresaID:    cfg.EmpresaID,
		TimestampUTC: timestampUTC,
		HashSHA256:   hashSha256,
		DispositivoID: cfg.DeviceID,
	}

	payloadBytes, err := json.Marshal(record)
	if err != nil {
		return fmt.Errorf("error al serializar payload: %w", err)
	}

	endpoint := fmt.Sprintf("%s/rest/v1/marcajes", cfg.SupabaseURL)
	req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(payloadBytes))
	if err != nil {
		return fmt.Errorf("error al construir request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", cfg.AnonKey)
	req.Header.Set("Authorization", "Bearer "+cfg.AnonKey)
	req.Header.Set("Prefer", "return=minimal")

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("error de conexión con Supabase: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("error de Supabase status %d", resp.StatusCode)
	}

	log.Printf("[MARCAJE ENVIADO] Trabajador: %s | Timestamp: %s | Hash: %s...%s | Device: %s",
		trabajadorID, timestampUTC, hashSha256[:12], hashSha256[len(hashSha256)-8:], cfg.DeviceID)
	return nil
}

func main() {
	cfg := Config{
		DeviceID:    getEnv("CHEKDOR_DEVICE_ID", "USB-01"),
		EmpresaID:   getEnv("CHEKDOR_EMPRESA_ID", "emp_demo_comercializadora_bajio"),
		SupabaseURL: getEnv("SUPABASE_URL", "https://app-chekdor.supabase.co"),
		AnonKey:     getEnv("SUPABASE_ANON_KEY", "sbp_demo_anon_key"),
		SaltSecret:  getEnv("CHEKDOR_SALT_SECRET", "chekdor_secret_celaya_2026"),
	}

	log.Println("==============================================================")
	log.Printf("CHEKDOR HID DAEMON v2.0 - Lector USB HID NTAG213\n")
	log.Printf("Dispositivo ID: %s | Empresa ID: %s\n", cfg.DeviceID, cfg.EmpresaID)
	log.Println("Reforma LFT Art. 132 Fracc. XXXIV · Prueba Plena Art. 805 LFT")
	log.Println("Sin app, sin celular. El trabajador acerca su tag NTAG213.")
	log.Println("==============================================================")

	// Captura de señales para apagado elegante
	stopChan := make(chan os.Signal, 1)
	signal.Notify(stopChan, os.Interrupt, syscall.SIGTERM)

	log.Println("[STATUS] Esperando lecturas de tarjeta en /dev/hidraw*...")

	// En un entorno de producción, aquí se abre github.com/karalabe/hid
	// y se decodifica el reporte RAW del chip NXP NTAG213 (7 bytes UID)
	<-stopChan
	log.Println("[CHEKDOR DAEMON] Apagado ordenado.")
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
