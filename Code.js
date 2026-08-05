/**
 * ═══════════════════════════════════════════════════════════════
 *  OLIVE BRANCH AID — Operations Suite  |  Google Apps Script
 * ═══════════════════════════════════════════════════════════════
 *
 *  INSTALL (prototype / handover)
 *  ───────────────────────────────
 *  1. script.google.com → New project
 *  2. Paste this file over Code.gs
 *  3. Click + → HTML file → name it exactly "Index" → paste Index.html
 *  4. Deploy → New deployment → Web app
 *       Execute as: Me
 *       Who has access: Anyone with a Google account
 *  5. Open the deployment URL — first load auto-creates the sheet
 *
 *  TO RESET DEMO DATA: delete "OBA Operations Data" from Drive
 *  (or Project Settings → Script Properties → delete OBA_SHEET_ID)
 *  then reload the URL to re-seed.
 *
 * ───────────────────────────────────────────────────────────────
 *  DEVELOPER HANDOVER — ITEMS TO WIRE UP
 * ───────────────────────────────────────────────────────────────
 *  Each item below is tagged DEV[n]. The same tag appears as a
 *  comment at the relevant line in this file and in Index.html
 *  so you can search for "DEV[1]", "DEV[2]" etc to jump straight
 *  to the code that needs work.
 *
 *  DEV[1]  BOOKING LINK / INVITE SYSTEM
 *          When a volunteer clicks "Send invite" in Triage step 3,
 *          the app calls sendInvite() below. Wire in your email +
 *          SMS gateway here to send the applicant a booking link.
 *          The status is already advanced automatically.
 *          → See: sendInvite() in this file
 *
 *  DEV[2]  FOOD PARCEL TRIGGER
 *          When a volunteer clicks "Registration Complete" (either
 *          button), finalise() in Index.html fires. It currently
 *          shows a success popup but does NOT call any backend.
 *          Wire this to your Pick Plan / parcel prep system so the
 *          household is queued for their first parcel automatically.
 *          → See: finalise() in Index.html (search DEV[2])
 *
 *  DEV[3]  HOMEWORK SMS
 *          In Registration Finalising, volunteers write homework for
 *          the applicant. A callout tells the volunteer this "will be
 *          sent as a text". Wire an SMS gateway call here.
 *          → See: renderRegFinalising() in Index.html (search DEV[3])
 *
 *  DEV[4]  WELLBEING PASSWORD / ACCESS CONTROL
 *          The Wellbeing section is protected by a plain-text password
 *          (WB_PASSWORD = 'OBA2026') in Index.html. This is fine for
 *          a prototype but must be replaced with proper role-based
 *          auth before going live — e.g. Google account session check,
 *          Apps Script session tokens, or an Identity-Aware Proxy.
 *          Not every volunteer should see wellbeing notes.
 *          → See: WB_PASSWORD and checkPw() in Index.html (search DEV[4])
 *
 *  DEV[5]  HOUSEHOLD LOOKUP / PREVIOUS RECORDS
 *          In Step 1 of a referral (Referral Information), there is a
 *          "Household Lookup" panel. Currently it does a surname match
 *          against the live referrals list only — it does NOT query a
 *          real previous-records database. Replace the lookup logic in
 *          renderStepReferralInfo() with a proper DB search.
 *          Also: the historicalReferrals array in MOCK (Index.html) is
 *          hard-coded demo data. For production, add a HistoricalReferrals
 *          sheet tab and return it from getData() in this file.
 *          → See: renderStepReferralInfo() in Index.html (search DEV[5])
 *          → See: getData() in this file (add historicalReferrals key)
 *
 *  DEV[6]  TEAM NOTES & MEETING AGENDA (Wellbeing → To-do / Notes)
 *          Notes added in this tab are stored in-session only — they
 *          vanish on refresh. Add a WBTeamNotes sheet tab and wire
 *          addWbTeamNote() in Index.html to save rows to that sheet.
 *          Similarly save/load the meeting date, location and agenda.
 *          → See: addWbTeamNote() and renderWbTodo() in Index.html (search DEV[6])
 *
 *  DEV[7]  FOLLOW-UP APPOINTMENT BOOKING
 *          "Offer a follow-up appointment" (in Registration Finalising
 *          and in the Wellbeing file) currently just shows a toast
 *          notification. Wire to the same booking-link system as DEV[1].
 *          → See: offerFollowUp() in Index.html (search DEV[7])
 *
 *  DEV[8]  FLAGS — SAVING TO SHEET
 *          The flags column (complex, disability, interpreter, dv, da)
 *          is updated in the browser when a volunteer ticks the
 *          checkboxes in Registration Finalising. The updated flags
 *          string is saved back via setFlags() below when saveWelfare()
 *          is called. Confirm this round-trips correctly with your
 *          sheet and test that flag dots/badges appear after a page reload.
 *          → See: setFlags() in this file, toggleFlag() in Index.html (search DEV[8])
 *
 *  DEV[9]  REBOOK / NEW APPOINTMENT OFFER
 *          "Offer new appointment" (in Household tab) and the rebook
 *          outcome button in Registration Finalising set the status to
 *          "Appointment Rescheduled" but do not send any communication.
 *          Wire to your booking-link system (same as DEV[1]).
 *          → See: offerNewAppt() and finalise() in Index.html (search DEV[9])
 *
 *  DEV[10] CONNECTING THE REAL REFERRAL FORM
 *          Your live Google Form writes to "Form Responses 1" with 38
 *          columns in a different order to this app's internal schema.
 *          See the FORM_COLUMN_MAP and deriveStatusFromForm_() at the
 *          bottom of this file for the full field mapping. Point an
 *          import trigger at that function to populate the Referrals
 *          sheet from the form automatically on submission.
 *          → See: FORM_COLUMN_MAP and deriveStatusFromForm_() in this file
 *
 *  DEV[11] BOROUGH COUNTS
 *          BOROUGH_COUNTS below is a static object used for the triage
 *          borough chips. Update these numbers to match your live data,
 *          or replace with a dynamic count from the Referrals sheet.
 *          → See: BOROUGH_COUNTS in this file
 *
 * ───────────────────────────────────────────────────────────────
 *  FLAG VALUES  (comma-separated string in 'flags' sheet column)
 * ───────────────────────────────────────────────────────────────
 *  complex      → "Complex" plum badge — complex case, WB follow-up needed
 *  disability   → "DIS" blue badge — disability or long-term condition
 *  interpreter  → "INT" teal badge — interpreter needed / ESOL
 *  dv           → ● dark crimson dot (tooltip only) — DV/DA in household
 *  da           → ● amber dot (tooltip only) — drug & alcohol use, be aware
 *  overdue      → triggers plum border on referral row
 * ═══════════════════════════════════════════════════════════════
 */

var REFERRAL_HEADERS = [
  'ref','householdId','name','borough','type','receivedDate','adults','children','ages','email','phone',
  'status','flags','circumstances','triagePrev','triageBorough','apptType','apptSlot',
  'apptDate','apptTime','openFrom','openTo','wbOfficer','distributionGroup','distributionType',
  'waitlistDate','welfareJson','notes'
];
var NOTE_HEADERS   = ['noteId','ref','date','author','category','duration','text'];
var ACTION_HEADERS = ['actionId','ref','name','action','dueBy','officer','priority','status'];
var HOUSEHOLD_HEADERS = ['id','name','primaryName','phone','email','postcode','borough','adults','children','ages','linkedRefs','created'];
var COLLECTION_HEADERS = ['ref','date','time','status'];
var HISTORICAL_HEADERS = ['ref','householdId','borough','receivedDate','adults','children','ages','phone','email','openFrom','openTo','status','circumstances','notes'];

// DEV[11]: Update these totals to match your live service data, or replace with a dynamic count from the Referrals sheet
var BOROUGH_COUNTS = {Lambeth:42, Southwark:29, Wandsworth:38, Croydon:24};

function doGet() {
  var template = HtmlService.createTemplateFromFile('Index');
  var output = template.evaluate();
  return output.setTitle('OBA');
}

function getSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('OBA_SHEET_ID');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) {} }
  var ss = SpreadsheetApp.create('OBA Operations Data');
  props.setProperty('OBA_SHEET_ID', ss.getId());
  seedData_(ss);
  return ss;
}

function monday_(offsetWeeks) {
  var d = new Date();
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7) + (offsetWeeks || 0) * 7);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}
function dateLabel_(daysFromNow) {
  var d = new Date(); d.setDate(d.getDate() + daysFromNow);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd MMM');
}
function curMonth_() {
  var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[new Date().getMonth()]+' 2026';
}

function seedData_(ss) {
  var MONA = monday_(0), MONB = monday_(1);
  var sh = ss.getSheets()[0]; sh.setName('Referrals'); sh.appendRow(REFERRAL_HEADERS);
  // Demo data — matches Index.html MOCK exactly. Fake info only.
  var rows = [
    ["REF-0101","Elizabeth Dickerson","Southwark","STANDARD","06 Jan","3","1","elizabeth.d@email.com","07700 900101","Active Beneficiary","","Settled into collection cycle.","accept","accept","in-person","","","","Feb 2026","Apr 2026","","Group 2","Collection","",""],
    ["REF-0102","William Davis","Lambeth","EMERGENCY","12 Jan","2","2","w.davis@email.com","07700 900102","Active Beneficiary","","Emergency parcel issued on day of referral.","accept","accept","in-person","","","","Feb 2026","Apr 2026","","Group 1","Delivery","",""],
    ["REF-0103","Miranda Knight","Southwark","STANDARD","18 Jan","1","3","miranda.k@email.com","07700 900103","Registration Complete - WB follow up required [complex]","complex,dv","Domestic violence history. Complex debt and MH needs.","accept","accept","in-person","","","","Feb 2026","May 2026","Sophie","Group 1","Delivery","",""],
    ["REF-0104","Cameron Young","Southwark","STANDARD","24 Jan","2","0","cam.young@email.com","07700 900104","Active Beneficiary","","Recently made redundant.","accept","accept","in-person","","","","Feb 2026","Apr 2026","","Group 2","Collection","",""],
    ["REF-0105","Dean Burch","Wandsworth","STANDARD","30 Jan","1","1","d.burch@email.com","07700 900105","Appointment offered/booking link sent","","Single parent, awaiting appointment.","accept","accept","in-person","",MONA,"09:30","","","","","","",""],
    ["REF-0106","Edward Frederick","Croydon","STANDARD","05 Feb","2","1","e.fred@email.com","07700 900106","Close file due to non-engagement","","No response after 3 contact attempts.","accept","accept","in-person","","","","","","","","","",""],
    ["REF-0107","Jennifer Mclaughlin","Wandsworth","EMERGENCY","11 Feb","2","2","j.mclaughlin@email.com","07700 900107","Registration Complete - No follow up required","","Fleeing domestic violence, emergency support.","accept","accept","in-person","","","","Mar 2026","May 2026","","Group 1","Delivery","",""],
    ["REF-0108","James Coffey","Lambeth","STANDARD","17 Feb","1","0","j.coffey@email.com","07700 900108","Close file due to non-engagement","","No contact after initial referral.","accept","accept","in-person","","","","","","","","","",""],
    ["REF-0109","Daniel Cooper","Croydon","STANDARD","23 Feb","2","1","d.cooper@email.com","07700 900109","Registration Complete - No follow up required","","Benefit delays causing short-term crisis.","accept","accept","in-person","","","","Mar 2026","Jun 2026","","Group 2","Collection","",""],
    ["REF-0110","Carlos Thompson","Lambeth","STANDARD","01 Mar","3","2","c.thompson@email.com","07700 900110","Active Beneficiary","","Large household, UC awarded but insufficient.","accept","accept","in-person","","","","Apr 2026","Jun 2026","","Group 1","Collection","",""],
    ["REF-0111","Mark Rodriguez","Lambeth","STANDARD","07 Mar","2","3","m.rodriguez@email.com","07700 900111","Appointment Rescheduled","interpreter","Rebooked after DNA. Interpreter needed — family does not speak English.","accept","accept","in-person","",MONA,"10:15","","","","","","",""],
    ["REF-0112","James Church","Wandsworth","EMERGENCY","13 Mar","1","2","j.church@email.com","07700 900112","Registration Complete - WB follow up required [complex]","complex,disability,interpreter","Chronic illness, benefit disruption, disability needs. Interpreter required.","accept","accept","in-person","","","","Apr 2026","Jul 2026","Harley","Group 2","Delivery","",""],
    ["REF-0113","Audrey Scott","Wandsworth","STANDARD","19 Mar","2","2","a.scott@email.com","07700 900113","Did not attend (DNA) registration","overdue","DNA at first appointment — no contact since. Second invite needed.","accept","accept","in-person","","","","","","","","","",""],
    ["REF-0114","Matthew Alvarado","Croydon","EMERGENCY","25 Mar","2","1","m.alvarado@email.com","07700 900114","Registration Complete - WB follow up required [complex]","complex","Crisis situation, complex MH and debt.","accept","accept","in-person","","","","Apr 2026",curMonth_(),"Sophie","Group 1","Delivery","",""],
    ["REF-0115","Scott Butler","Southwark","EMERGENCY","31 Mar","1","0","s.butler@email.com","07700 900115","Close file due to non-engagement","","Unable to reach after DNA.","accept","accept","in-person","","","","","","","","","",""],
    ["REF-0116","Paula Gray","Southwark","EMERGENCY","06 Apr","2","1","p.gray@email.com","07700 900116","Appointment offered/booking link sent","","Awaiting registration appointment.","accept","accept","in-person","",MONA,"11:00","","","","","","",""],
    ["REF-0117","Claudia Huber","Lambeth","EMERGENCY","12 Apr","2","2","c.huber@email.com","07700 900117","Active Beneficiary","","Zero-hours contract, irregular income.","accept","accept","in-person","","","","May 2026","Jul 2026","","Group 2","Collection","",""],
    ["REF-0118","William Zimmerman","Lambeth","EMERGENCY","18 Apr","3","0","w.zimm@email.com","07700 900118","Registration Complete - No follow up required","","Temporary job loss, now stable.","accept","accept","in-person","","","","May 2026","Jul 2026","","Group 1","Collection","",""],
    ["REF-0119","Michelle Hunt","Southwark","EMERGENCY","24 Apr","2","1","m.hunt@email.com","07700 900119","Registration Complete - No follow up required","","Rent arrears, food crisis resolved.","accept","accept","in-person","","","","May 2026","Jul 2026","","Group 2","Collection","",""],
    ["REF-0120","Steven Miller","Southwark","STANDARD","30 Apr","2","3","s.miller@email.com","07700 900120","Registration Complete - WB follow up required [complex]","complex","Complex debt, benefits appeal in progress.","accept","accept","in-person","","","","May 2026","Aug 2026","Sophie","Group 1","Collection","",""],
    ["REF-0121","Patricia Schmidt","Southwark","STANDARD","06 May","1","2","p.schmidt@email.com","07700 900121","Registration Complete - WB follow up required [complex]","complex,da","Mental health crisis, safeguarding concerns. D&A history — be aware.","accept","accept","in-person","","","","Jun 2026","Aug 2026","Harley","Group 2","Delivery","",""],
    ["REF-0122","Leslie Martin","Wandsworth","STANDARD","12 May","2","3","l.martin@email.com","07700 900122","Active Beneficiary","","Family settled, picking up fortnightly.","accept","accept","in-person","","","","Jun 2026","Aug 2026","","Group 2","Collection","",""],
    ["REF-0123","Lisa Wagner","Croydon","EMERGENCY","18 May","1","1","l.wagner@email.com","07700 900123","Active Beneficiary","","Single parent, domestic violence escaper.","accept","accept","in-person","","","","Jun 2026","Sep 2026","","Group 1","Delivery","",""],
    ["REF-0124","Dylan Cruz","Lambeth","STANDARD","24 May","2","0","d.cruz@email.com","07700 900124","Active Beneficiary","","Both adults on zero-hours, hours cut.","accept","accept","in-person","","","","Jun 2026","Sep 2026","","Group 1","Collection","",""],
    ["REF-0125","Jesse Taylor","Southwark","EMERGENCY","30 May","2","2","j.taylor@email.com","07700 900125","Registration Complete - No follow up required","","Short-term crisis resolved.","accept","accept","in-person","","","","Jun 2026",curMonth_(),"","Group 2","Collection","",""],
    ["REF-0126","Amber Smith","Southwark","STANDARD","05 Jun","2","1","a.smith@email.com","07700 900126","Active Beneficiary","","Benefits delayed after move.","accept","accept","in-person","","","","Jun 2026","Sep 2026","","Group 1","Collection","",""],
    ["REF-0127","Melissa Owens","Wandsworth","STANDARD","11 Jun","1","2","m.owens@email.com","07700 900127","Registration Complete - WB follow up required [complex]","complex","Complex debt, SHINE referral in progress.","accept","accept","in-person","","","","Jun 2026","Sep 2026","Harley","Group 1","Collection","",""],
    ["REF-0128","Nicholas Molina","Croydon","EMERGENCY","17 Jun","3","1","n.molina@email.com","07700 900128","Registration Complete - No follow up required","","Crisis resolved, regular collection.","accept","accept","in-person","","","","Jul 2026","Sep 2026","","Group 2","Collection","",""],
    ["REF-0129","Mark Flores","Lambeth","EMERGENCY","23 Jun","4","3","m.flores@email.com","07700 900129","Registration Complete - WB follow up required [complex]","complex","Large family, complex safeguarding referral.","accept","accept","in-person","","","","Jul 2026","Oct 2026","Sophie","Group 2","Delivery","",""],
    ["REF-0130","Brenda Barton","Croydon","EMERGENCY","29 Jun","2","2","b.barton@email.com","07700 900130","Registration Complete - WB follow up required [complex]","complex","Mental health crisis, infant in household.","accept","accept","in-person","","","","Jul 2026","Oct 2026","Sophie","Group 1","Delivery","",""],
    ["REF-0131","Amara Okonkwo","Lambeth","STANDARD","01 Jul","2","3","amara.ok@email.com","07700 900131","Referral received","","Lost job last month, waiting on first UC payment. Children have school meal support but nothing for weekends.","","","in-person","","","","","","","","","",""],
    ["REF-0132","Deniz Yilmaz","Wandsworth","EMERGENCY","03 Jul","1","1","deniz.y@email.com","07700 900132","Referral received","interpreter","Fled temporary accommodation, arrived with very little. Emergency parcel needed. Interpreter needed.","","","in-person","","","","","","","","","",""],
    ["REF-0133","Grace Mensah","Southwark","STANDARD","06 Jul","2","0","grace.m@email.com","07700 900133","Referral received","","Both adults on zero-hours contracts, hours cut sharply. Struggling with rising bills.","","","in-person","","","","","","","","","",""],
    ["REF-0134","Ivan Petrov","Croydon","STANDARD","09 Jul","1","2","ivan.p@email.com","07700 900134","Referral received","","Single parent, recently signed off work sick. GP letter to follow.","","","in-person","","","","","","","","","",""],
    ["REF-0135","Fatima Al-Rashid","Lambeth","EMERGENCY","10 Jul","3","4","fatima.ar@email.com","07700 900135","Referral received","","Large household, main earner hospitalised. Needs urgent support and likely ongoing.","","","in-person","","","","","","","","","",""]
  ];
  rows.forEach(function(r) { sh.appendRow(r); });

  var n = ss.insertSheet('WellbeingNotes'); n.appendRow(NOTE_HEADERS);  [
    ["N-1","REF-0103",dateLabel_(-9),"Sophie","Safeguarding","25","Initial disclosure of domestic violence during registration. Did not record perpetrator details per data-privacy rule. Agreed a safety plan and shared Refuge + National DV Helpline numbers. Escalated to senior staff same day."],
    ["N-2","REF-0103",dateLabel_(-4),"Sophie","Benefits","15","Reviewed UC journal. Household likely missing the disability element — referred to Income Max CIC for a full benefits check. Beneficiary informed and consented."],
    ["N-3","REF-0112",dateLabel_(-6),"Harley","Debt","20","Mapped rent arrears and two credit-card debts. Warm referral made to SHINE. Homework set: bring last three months of bank statements to next session."],
    ["N-4","REF-0114",dateLabel_(-2),"Sophie","Medical","10","Chronic illness limits ability to collect — switched to delivery. Chasing doctor letter to confirm for UC journal."]
  ].forEach(function(r) { n.appendRow(r); });

  var a = ss.insertSheet('Actions'); a.appendRow(ACTION_HEADERS);
  [
    ["A-1","REF-0103","Miranda Knight","Call beneficiary re: DV disclosure — safety check",dateLabel_(-1),"Sophie","urgent","open"],
    ["A-2","REF-0103","Miranda Knight","Chase Income Max CIC on disability benefits check",dateLabel_(5),"Sophie","pending","open"],
    ["A-3","REF-0112","James Church","Follow up with SHINE on debt referral outcome",dateLabel_(3),"Harley","pending","open"],
    ["A-4","REF-0114","Matthew Alvarado","Book month-2 extension review (needs two staff to agree)",dateLabel_(1),"Sophie","urgent","open"]
  ].forEach(function(r) { a.appendRow(r); });

  var hr = ss.insertSheet('HistoricalReferrals'); hr.appendRow(HISTORICAL_HEADERS);
  [
    ['REF-0012','HH-001','Lambeth','14 Feb 2024','3','0','','07700 900201','tariq.c@email.com','Mar 2024','Jun 2024','Registration Complete - No follow up required','Benefit sanction, short-term food crisis.','Closed after 3 months. No complex needs.'],
    ['REF-0030','HH-002','Lambeth','10 Aug 2024','3','0','','07700 900202','adam.o@email.com','Sep 2024','Dec 2024','Registration Complete - No follow up required','Redundancy, awaiting new employment.','Found work in month 3. Closed on schedule.'],
    ['REF-0045','HH-003','Lambeth','03 Nov 2024','3','0','','07700 900205','maya.f@email.com','Dec 2024','Mar 2025','Registration Complete - No follow up required','Hours cut at work, temporary support.','Hours restored. Closed after 3 months.'],
    ['REF-0058','HH-004','Lambeth','20 Jan 2025','1','1','1F','07700 900208','zara.m@email.com','Feb 2025','May 2025','Registration Complete - No follow up required','Asylum seeker, no recourse to public funds.','Extended to 4 months. Referred to legal aid.'],
    ['REF-0071','HH-005','Lambeth','15 Mar 2025','2','0','','07700 900211','audrey.w@email.com','Apr 2025','Jul 2025','Registration Complete - No follow up required','Disability-related benefit gap.','PIP awarded month 2. Closed after 3 months.'],
    ['REF-0089','HH-006','Croydon','03 Sep 2025','2','2','12M,2M','07700 900206','carlos.g@email.com','Oct 2025','Jan 2026','Registration Complete - WB follow up required [complex]','DV situation emerged. Complex MH needs flagged.','Safeguarding referral made. Case closed after 4 months.'],
    ['REF-0095','HH-007','Lambeth','11 Jan 2025','2','2','8F,10M','07700 900240','ethan.h@email.com','Jan 2025','Apr 2025','Registration Complete - No follow up required','Job loss, short-term food crisis.','Resolved within standard 3-month cycle.']
  ].forEach(function(r) { hr.appendRow(r); });

  /* Households sheet */
  var hh = ss.insertSheet('Households'); hh.appendRow(HOUSEHOLD_HEADERS);
  [
    ['HH-001','Chowdhury','Tariq Chowdhury','07700 900201','tariq.c@email.com','SW9 7QD','Lambeth','3','0','','REF-0012,REF-0201','14 Feb 2024'],
    ['HH-002','Owens','Adam Owens','07700 900202','adam.o@email.com','SE11 4AU','Lambeth','3','0','','REF-0030,REF-0202','10 Aug 2024'],
    ['HH-003','Frederick','Maya Frederick','07700 900205','maya.f@email.com','SW2 1JF','Lambeth','3','0','','REF-0045,REF-0205','03 Nov 2024'],
    ['HH-004','Martin','Zara Martin','07700 900208','zara.m@email.com','SW9 8PS','Lambeth','1','1','2F','REF-0058,REF-0208','20 Jan 2025'],
    ['HH-005','Wagner','Audrey Wagner','07700 900211','audrey.w@email.com','SE5 0TF','Lambeth','2','0','','REF-0071,REF-0211','15 Mar 2025'],
    ['HH-006','Gupta','Carlos Gupta','07700 900206','carlos.g@email.com','CR0 2AJ','Croydon','3','2','14M,2M','REF-0089,REF-0206','03 Sep 2025'],
    ['HH-007','Huber','Ethan Huber','07700 900240','ethan.h@email.com','SW4 6DH','Lambeth','3','3','10F,12M,12M','REF-0095,REF-0240','11 Jan 2025']
  ].forEach(function(r) { hh.appendRow(r); });

  /* Collections sheet */
  var co = ss.insertSheet('Collections'); co.appendRow(COLLECTION_HEADERS);
}

/* ─── Sheet helpers ─── */
function ensureColumns_(sh, headers) {
  if (!sh) return;
  var last = sh.getLastColumn();
  var cur = last ? sh.getRange(1,1,1,last).getValues()[0].map(String) : [];
  headers.forEach(function(h) { if (cur.indexOf(h) === -1) { sh.getRange(1, cur.length+1).setValue(h); cur.push(h); } });
}
function sheetToObjects_(sh, headers) {
  if (!sh) return [];
  var vals = sh.getDataRange().getValues(), head = vals[0].map(String), out = [];
  for (var i = 1; i < vals.length; i++) {
    var o = {};
    for (var j = 0; j < headers.length; j++) {
      var ci = head.indexOf(headers[j]);
      var v = ci >= 0 ? vals[i][ci] : '';
      o[headers[j]] = (v == null) ? '' : (v instanceof Date)
        ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(v);
    }
    out.push(o);
  }
  return out;
}
function findRow_(sh, key, val) {
  var vals = sh.getDataRange().getValues();
  var col = vals[0].map(String).indexOf(key);
  for (var i = 1; i < vals.length; i++) if (String(vals[i][col]) === String(val)) return i + 1;
  return -1;
}

/* ─── Public API ─── */
function getData() {
  var ss = getSpreadsheet_();
  var refs = ss.getSheetByName('Referrals');
  ensureColumns_(refs, REFERRAL_HEADERS);
  var hhSheet = ss.getSheetByName('Households');
  if (hhSheet) ensureColumns_(hhSheet, HOUSEHOLD_HEADERS);
  var collSheet = ss.getSheetByName('Collections');
  if (collSheet) ensureColumns_(collSheet, COLLECTION_HEADERS);
  var histSheet = ss.getSheetByName('HistoricalReferrals');
  if (histSheet) ensureColumns_(histSheet, HISTORICAL_HEADERS);
  return {
    referrals:            sheetToObjects_(refs, REFERRAL_HEADERS),
    notes:                sheetToObjects_(ss.getSheetByName('WellbeingNotes'), NOTE_HEADERS),
    actions:              sheetToObjects_(ss.getSheetByName('Actions'), ACTION_HEADERS),
    historicalReferrals:  histSheet ? sheetToObjects_(histSheet, HISTORICAL_HEADERS) : [],
    households:           hhSheet ? sheetToObjects_(hhSheet, HOUSEHOLD_HEADERS).map(function(h){h.linkedRefs=h.linkedRefs?h.linkedRefs.split(','):[];return h;}) : [],
    collections:          collSheet ? sheetToObjects_(collSheet, COLLECTION_HEADERS) : [],
    boroughCounts:        BOROUGH_COUNTS,
    sheetUrl:             ss.getUrl()
  };
}
function setStatus(ref, status) {
  var sh = getSpreadsheet_().getSheetByName('Referrals');
  ensureColumns_(sh, REFERRAL_HEADERS);
  var row = findRow_(sh, 'ref', ref); if (row < 0) return { ok: false };
  sh.getRange(row, REFERRAL_HEADERS.indexOf('status')+1).setValue(status);
  return { ok: true };
}
function saveTriageField(ref, field, value) {
  var sh = getSpreadsheet_().getSheetByName('Referrals');
  ensureColumns_(sh, REFERRAL_HEADERS);
  var row = findRow_(sh, 'ref', ref); if (row < 0) return { ok: false };
  var col = REFERRAL_HEADERS.indexOf(field)+1; if (col > 0) sh.getRange(row, col).setValue(value);
  return { ok: true };
}
function sendInvite(ref, apptType) {
  var sh = getSpreadsheet_().getSheetByName('Referrals');
  var row = findRow_(sh, 'ref', ref); if (row < 0) return { ok: false };
  var status = (apptType === 'online') ? 'Pending online registration appointment' : 'Appointment offered/booking link sent';
  sh.getRange(row, REFERRAL_HEADERS.indexOf('status')+1).setValue(status);
  // DEV[1]: Wire your booking system here — send applicant an email + SMS with a booking link
  // MailApp.sendEmail(email, 'Your OBA appointment', inviteBody);
  // YourSmsGateway.send(phone, bookingUrl);
  return { ok: true, status: status };
}
function addToWaitlist(ref) {
  var sh = getSpreadsheet_().getSheetByName('Referrals');
  ensureColumns_(sh, REFERRAL_HEADERS);
  var row = findRow_(sh, 'ref', ref); if (row < 0) return { ok: false };
  sh.getRange(row, REFERRAL_HEADERS.indexOf('status')+1).setValue('Added to waiting list');
  sh.getRange(row, REFERRAL_HEADERS.indexOf('waitlistDate')+1).setValue(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'));
  return { ok: true };
}
function sendWaitlistEmail(ref) {
  // DEV: Wire to your email system
  // var sh = getSpreadsheet_().getSheetByName('Referrals');
  // var row = findRow_(sh, 'ref', ref);
  // var email = sh.getRange(row, REFERRAL_HEADERS.indexOf('email')+1).getValue();
  // MailApp.sendEmail(email, 'OBA Waiting List Update', 'You have been added to our waiting list...');
  return { ok: true };
}
function saveHousehold(household) {
  var ss = getSpreadsheet_();
  var sh = ss.getSheetByName('Households');
  if (!sh) { sh = ss.insertSheet('Households'); sh.appendRow(HOUSEHOLD_HEADERS); }
  ensureColumns_(sh, HOUSEHOLD_HEADERS);
  var existing = findRow_(sh, 'id', household.id);
  var rowData = HOUSEHOLD_HEADERS.map(function(h) {
    return h === 'linkedRefs' ? (household[h]||[]).join(',') : (household[h]||'');
  });
  if (existing > 0) {
    sh.getRange(existing, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sh.appendRow(rowData);
  }
  return { ok: true };
}
function saveCollection(ref, date, time, status) {
  var ss = getSpreadsheet_();
  var sh = ss.getSheetByName('Collections');
  if (!sh) { sh = ss.insertSheet('Collections'); sh.appendRow(COLLECTION_HEADERS); }
  var vals = sh.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === ref && String(vals[i][1]) === date) {
      sh.getRange(i+1, COLLECTION_HEADERS.indexOf('status')+1).setValue(status);
      return { ok: true };
    }
  }
  sh.appendRow([ref, date, time, status]);
  return { ok: true };
}
function saveWelfare(ref, welfareJson, group, distType, status) {
  var sh = getSpreadsheet_().getSheetByName('Referrals');
  ensureColumns_(sh, REFERRAL_HEADERS);
  var row = findRow_(sh, 'ref', ref); if (row < 0) return { ok: false };
  sh.getRange(row, REFERRAL_HEADERS.indexOf('welfareJson')+1).setValue(welfareJson || '');
  if (group)    sh.getRange(row, REFERRAL_HEADERS.indexOf('distributionGroup')+1).setValue(group);
  if (distType) sh.getRange(row, REFERRAL_HEADERS.indexOf('distributionType')+1).setValue(distType);
  if (status)   sh.getRange(row, REFERRAL_HEADERS.indexOf('status')+1).setValue(status);
  return { ok: true };
}
// DEV[8]: Called by toggleFlag() in Index.html when a volunteer ticks/unticks a flag checkbox in Registration Finalising
function setFlags(ref, flags) {
  var sh = getSpreadsheet_().getSheetByName('Referrals');
  ensureColumns_(sh, REFERRAL_HEADERS);
  var row = findRow_(sh, 'ref', ref); if (row < 0) return { ok: false };
  sh.getRange(row, REFERRAL_HEADERS.indexOf('flags')+1).setValue(flags);
  return { ok: true };
}
function addWellbeingNote(ref, author, category, duration, text) {
  var ss = getSpreadsheet_(), sh = ss.getSheetByName('WellbeingNotes');
  if (!sh) { sh = ss.insertSheet('WellbeingNotes'); sh.appendRow(NOTE_HEADERS); }
  var id = 'N-' + new Date().getTime();
  var date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd MMM');
  sh.appendRow([id, ref, date, author, category, duration, text]);
  return { ok: true, note: { noteId: id, ref: ref, date: date, author: author, category: category, duration: duration, text: text } };
}
function completeAction(actionId) {
  var sh = getSpreadsheet_().getSheetByName('Actions');
  var row = findRow_(sh, 'actionId', actionId); if (row < 0) return { ok: false };
  sh.getRange(row, ACTION_HEADERS.indexOf('status')+1).setValue('done');
  return { ok: true };
}

/* ─── Form column mapping (developer reference) ─── DEV[10] ──────
 *  Your live "Form Responses 1" sheet → internal app schema
 *
 *  'Date of Referral'                                → receivedDate
 *  'First name' + ' ' + 'Last name'                 → name
 *  'Borough'                                         → borough
 *  'Do you need a one off emergency parcel?' Yes     → type = EMERGENCY
 *  'Total Number of Adults (18+ years old)'          → adults
 *  'Number of Children'                              → children
 *  'Ages of Children (comma separated)'              → ages (store in welfareJson)
 *  'Email'                                           → email
 *  'Contact Phone Number'                            → phone
 *  'Details of any allergies'                        → welfareJson.allergens
 *  'Dietary requirements'                            → welfareJson.diet
 *  'Please tell us about the households needs'       → circumstances
 *  'Was mtg Attended? Y/N'                           → status (see deriveStatus below)
 *  'Support Y/N?'                                    → add 'complex' to flags
 *  'Date of welcome letter confirm 3 mths'           → openFrom (month year)
 *  'End Date'                                        → openTo (month year)
 *  'Collection Group 1 or 2'                         → distributionGroup
 *  'Delivery/ Collection'                            → distributionType
 *  'Open/ Closed'                                    → status (open vs closed branch)
 *  Flags (complex, disability, interpreter, dv, da)  → flags column (set manually in app)
 * ─────────────────────────────────────────────────────────────*/
function deriveStatusFromForm_(row) {
  var attended = String(row['Was mtg Attended? Y/N'] || '').toUpperCase() === 'Y';
  var second   = String(row['If no, offer of 2nd mtg. Was this attended - Y/N'] || '').toUpperCase();
  var welcome  = !!row['Date of welcome letter confirm 3 mths'];
  var support  = String(row['Support Y/N? see comment for actions'] || '').toUpperCase() === 'Y';
  var open     = String(row['Open/ Closed'] || '').toLowerCase().indexOf('open') >= 0;
  if (!attended && !welcome) return 'Referral received';
  if (open) {
    if (attended || second === 'Y') return support ? 'Registration Complete - WB follow up required [complex]' : (welcome ? 'Active Beneficiary' : 'Registration appointment attended');
    if (second === 'N') return 'Did not attend (DNA) registration';
    return 'Appointment offered/booking link sent';
  } else {
    if (attended || second === 'Y') return 'Registration Complete - No follow up required';
    if (second === 'N') return 'Close file due to non-engagement';
    return 'Referral Rejected';
  }
}