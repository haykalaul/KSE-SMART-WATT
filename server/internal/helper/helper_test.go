package helper

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

// simple CSV sample: Date,Time,Appliance,Energy_Consumption,Room,Status
const simpleCSV = `Date,Time,Appliance,Energy_Consumption,Room,Status
2022-01-01,00:00,Refrigerator,1.2,Kitchen,On
2022-01-01,01:00,Refrigerator,1.1,Kitchen,On
2022-01-01,00:00,TV,0.3,Living Room,Off
`

// detailed CSV sample (includes more columns; column order is slightly different to exercise header mapping)
const detailedCSV = `timestamp,device,type,location,power,duration,usage_kwh,cost,status,connectivity
2022-01-01T00:00:00Z,Refrigerator,Fridge,Kitchen,150,1,1.2,0.5,On,WiFi
2022-01-01T01:00:00Z,TV,Entertainment,Living Room,50,0.5,0.3,0.12,Off,IR
`

func TestParseCSVtoSliceOfStruct_SimpleSchema(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(simpleCSV))
	}))
	defer srv.Close()

	apps, err := ParseCSVtoSliceOfStruct(srv.URL)
	if err != nil {
		t.Fatalf("ParseCSVtoSliceOfStruct simple schema returned error: %v", err)
	}

	if len(apps) == 0 {
		t.Fatalf("expected at least one appliance parsed from simple csv, got 0")
	}

	// find Refrigerator
	var found bool
	for _, a := range apps {
		if a.Name == "Refrigerator" {
			found = true
			if a.Energy <= 0 {
				t.Fatalf("expected positive energy for Refrigerator, got %v", a.Energy)
			}
			// AverageUsage and UsageToday should be calculated from durations (durations default to 0 in simple CSV)
			// so we at least ensure the structure is filled
		}
	}
	if !found {
		t.Fatalf("Refrigerator not found in parsed appliances: %+v", apps)
	}
}

func TestParseCSVtoSliceOfStruct_DetailedSchema(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(detailedCSV))
	}))
	defer srv.Close()

	apps, err := ParseCSVtoSliceOfStruct(srv.URL)
	if err != nil {
		t.Fatalf("ParseCSVtoSliceOfStruct detailed schema returned error: %v", err)
	}

	if len(apps) != 2 {
		t.Fatalf("expected 2 appliances parsed from detailed csv, got %d", len(apps))
	}

	// verify fields mapped
	for _, a := range apps {
		if a.Name == "" {
			t.Fatalf("parsed appliance has empty name: %+v", a)
		}
		if a.Energy <= 0 {
			// In detailedCSV we used usage_kwh column, parser should map it to Energy
			t.Fatalf("expected positive energy for device %s, got %v", a.Name, a.Energy)
		}
	}
}
