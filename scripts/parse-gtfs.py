#!/usr/bin/env python3
import csv
import json
import sys
import os
import urllib.request
import zipfile
import tempfile

GTFS_URL = "https://evta.org/gtfs.zip"

EAGLEVAIL_WEST = 65   # stop 65: "HIGHWAY 6 + EAGLE VAIL RD" (westbound platform)
EAGLEVAIL_EAST = 48   # stop 48: "HIGHWAY 6 + EAGLE VAIL RD" (eastbound platform)
AVON = 196            # stop 196: "AVON STATION"
WALMART = 21          # stop 21: "FAWCETT RD + YODER AVE"
VAIL = 20             # stop 20: "VAIL TRANSPORTATION CENTER"

ROUTE_ID = "HY6"
SERVICE_ID = "1"

STOP_IDS = {EAGLEVAIL_WEST, EAGLEVAIL_EAST, AVON, WALMART, VAIL}

def download_gtfs(dest_dir):
    zip_path = os.path.join(dest_dir, "gtfs.zip")
    print(f"Downloading {GTFS_URL}...")
    urllib.request.urlretrieve(GTFS_URL, zip_path)
    with zipfile.ZipFile(zip_path) as zf:
        zf.extractall(dest_dir)
    print(f"Extracted to {dest_dir}")

def parse(gtfs_dir):
    hy6_trips = {}
    with open(os.path.join(gtfs_dir, "trips.txt")) as f:
        for row in csv.DictReader(f):
            if row["route_id"] == ROUTE_ID and row["service_id"] == SERVICE_ID:
                hy6_trips[row["trip_id"]] = int(row["direction_id"])

    trip_stops = {}
    with open(os.path.join(gtfs_dir, "stop_times.txt")) as f:
        for row in csv.DictReader(f):
            tid = row["trip_id"]
            sid = int(row["stop_id"])
            if tid in hy6_trips and sid in STOP_IDS:
                if tid not in trip_stops:
                    trip_stops[tid] = {}
                trip_stops[tid][sid] = row["departure_time"]

    schedules = {
        "eaglevail": {"west": set(), "east": set()},
        "avon": {"west": set(), "east": set()},
        "walmart": {"west": set(), "east": set()},
        "vail": {"west": set(), "east": set()},
    }

    for tid, stops in trip_stops.items():
        direction = hy6_trips[tid]  # 0=westbound (to Edwards), 1=eastbound (to Vail)

        if direction == 0:
            if EAGLEVAIL_WEST in stops:
                schedules["eaglevail"]["west"].add(stops[EAGLEVAIL_WEST])
            if AVON in stops:
                schedules["avon"]["west"].add(stops[AVON])
            if WALMART in stops:
                schedules["walmart"]["west"].add(stops[WALMART])
            if VAIL in stops:
                schedules["vail"]["west"].add(stops[VAIL])
        else:
            if EAGLEVAIL_EAST in stops:
                schedules["eaglevail"]["east"].add(stops[EAGLEVAIL_EAST])
            if AVON in stops:
                schedules["avon"]["east"].add(stops[AVON])
            if WALMART in stops:
                schedules["walmart"]["east"].add(stops[WALMART])
            if VAIL in stops:
                schedules["vail"]["east"].add(stops[VAIL])

    def sort_key(t):
        h, m, s = t.split(":")
        return int(h) * 3600 + int(m) * 60

    def fmt(times):
        return [f"{int(t.split(':')[0]) % 24}:{t.split(':')[1]}" for t in sorted(times, key=sort_key)]

    result = {}
    for stop in ["eaglevail", "avon", "walmart", "vail"]:
        result[stop] = {}
        for d in ["west", "east"]:
            result[stop][d] = fmt(schedules[stop][d])

    return result

def main():
    gtfs_dir = sys.argv[1] if len(sys.argv) > 1 else None

    if not gtfs_dir:
        gtfs_dir = tempfile.mkdtemp(prefix="gtfs_")
        download_gtfs(gtfs_dir)

    result = parse(gtfs_dir)

    print("\n// For index.html schedules object:")
    print("const schedules = {")
    for stop in ["eaglevail", "avon", "walmart", "vail"]:
        print(f"  {stop}: {{")
        for d in ["west", "east"]:
            times = result[stop][d]
            quoted = ",".join(f"'{t}'" for t in times)
            print(f"    {d}: [{quoted}],")
        print(f"  }},")
    print("};")

    print("\n// For widget.js SCHEDULES (EagleVail only):")
    print("const SCHEDULES = {")
    for d in ["west", "east"]:
        times = result["eaglevail"][d]
        quoted = ",".join(f"'{t}'" for t in times)
        print(f"  {d}: [{quoted}],")
    print("};")

if __name__ == "__main__":
    main()
