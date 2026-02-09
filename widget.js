// Vail Bus Widget for Scriptable
//
// SETUP:
// 1. Download "Scriptable" from App Store
// 2. Create new script, paste this code
// 3. Long-press home screen > add Scriptable widget
// 4. Edit widget > set Parameter to: west OR east
//    - "west" = to Beaver Creek (skiing)
//    - "east" = to Vail (skiing)
// 5. Tap widget to open full app

const SCHEDULES = {
  west: ['5:38','6:23','6:38','6:43','7:03','7:23','7:38','7:43','8:03','8:23','8:38','8:43','9:03','9:23','9:38','9:43','10:03','10:23','10:38','10:43','11:03','11:23','11:38','12:03','12:23','12:38','13:03','13:23','13:38','14:03','14:23','14:38','15:03','15:23','15:33','15:38','16:03','16:23','16:33','16:38','17:03','17:23','17:33','17:38','18:03','18:23','18:53','19:23','19:53','20:23','20:53','21:23','21:53','22:23','22:53','23:23','23:53','0:23','1:23'],
  east: ['5:27','5:47','6:27','6:47','7:07','7:37','7:47','8:07','8:37','8:47','9:07','9:27','9:47','10:07','10:27','10:47','11:07','11:27','11:47','12:07','12:27','12:47','13:07','13:27','13:47','14:07','14:27','14:47','15:07','15:27','15:47','16:07','16:27','16:47','17:07','17:27','17:47','18:07','18:27','19:07','19:47','20:27','21:07','21:47','22:27','23:07','23:47','0:27']
};

const LABELS = {
  west: "Beaver Creek 🏔️",
  east: "Vail 🎿"
};

let direction = "west";
if (args.widgetParameter) {
  direction = args.widgetParameter.toLowerCase().trim();
}
if (!SCHEDULES[direction]) direction = "west";

function parseTime(t) {
  let parts = t.split(":");
  let h = parseInt(parts[0]);
  let m = parseInt(parts[1]);
  return h * 3600 + m * 60;
}

function toAmPm(t) {
  let parts = t.split(":");
  let h = parseInt(parts[0]);
  let m = parseInt(parts[1]);
  let suffix = (h >= 12 && h < 24) ? "p" : "a";
  let hour = h % 12;
  if (hour === 0) hour = 12;
  let mStr = m < 10 ? "0" + m : "" + m;
  return hour + ":" + mStr + suffix;
}

function getNextBuses() {
  let now = new Date();
  let nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  let times = SCHEDULES[direction];
  let upcoming = [];

  for (let i = 0; i < times.length; i++) {
    let t = times[i];
    let secs = parseTime(t);
    let adjusted = secs;
    if (secs < 18000) adjusted = secs + 86400;
    let nowAdj = nowSecs < 18000 ? nowSecs + 86400 : nowSecs;
    let diff = adjusted - nowAdj;
    if (diff >= 0) {
      upcoming.push({time: t, diff: diff});
    }
  }

  upcoming.sort(function(a, b) { return a.diff - b.diff; });
  return upcoming.slice(0, 2);
}

function formatCountdown(secs) {
  let mins = Math.floor(secs / 60);
  if (mins >= 60) {
    let h = Math.floor(mins / 60);
    let m = mins % 60;
    let mStr = m < 10 ? "0" + m : "" + m;
    return h + ":" + mStr;
  }
  return mins + "m";
}

function getColor(mins) {
  if (mins >= 10) return new Color("#22c55e");
  if (mins >= 5) return new Color("#eab308");
  return new Color("#ef4444");
}

let widget = new ListWidget();
widget.backgroundColor = new Color("#000000");
widget.setPadding(12, 16, 12, 16);
widget.url = "https://suryagaddipati.github.io/transit-tracker/";

let buses = getNextBuses();

let header = widget.addText("🎿 Slope Shuttle");
header.font = Font.semiboldSystemFont(12);
header.textColor = new Color("#888888");

widget.addSpacer(4);

let dest = widget.addText(LABELS[direction]);
dest.font = Font.mediumSystemFont(11);
dest.textColor = new Color("#666666");

widget.addSpacer(8);

if (buses.length > 0) {
  let mins = Math.floor(buses[0].diff / 60);

  let countdown = widget.addText(formatCountdown(buses[0].diff));
  countdown.font = Font.boldSystemFont(36);
  countdown.textColor = getColor(mins);

  widget.addSpacer(4);

  let departs = widget.addText("Departs " + toAmPm(buses[0].time));
  departs.font = Font.systemFont(11);
  departs.textColor = new Color("#555555");

  if (buses.length > 1) {
    let then = widget.addText("Then " + toAmPm(buses[1].time));
    then.font = Font.systemFont(10);
    then.textColor = new Color("#444444");
  }
} else {
  let none = widget.addText("No more buses");
  none.font = Font.systemFont(14);
  none.textColor = new Color("#555555");
}

widget.refreshAfterDate = new Date(Date.now() + 300000);

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentSmall();
}

Script.complete();
