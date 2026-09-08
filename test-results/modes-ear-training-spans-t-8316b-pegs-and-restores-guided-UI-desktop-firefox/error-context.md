# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: modes.spec.ts >> ear training spans the settings row, plays calibrated pegs and restores guided UI
- Location: e2e\tuner\modes.spec.ts:40:1

# Error details

```
Error: browserContext.close: Protocol error (Browser.removeBrowserContext): can't access property "_maybeDontRestoreTabs", this._windows[aWindow.__SSi] is undefined
```

# Page snapshot

```yaml
- main [ref=e2]:
  - generic [ref=e3]:
    - navigation "Tuner navigation" [ref=e5]:
      - link "Back to KINS home" [ref=e6] [cursor=pointer]:
        - /url: /
      - button "TUNER Standard" [ref=e9] [cursor=pointer]:
        - generic [ref=e10]: TUNER
        - generic [ref=e11]: Standard
      - button "Open tuner settings" [active] [ref=e15] [cursor=pointer]:
        - generic [ref=e16]: 
    - region "Tuning meter" [ref=e17]:
      - button "Start tuning" [ref=e18] [cursor=pointer]
      - generic [ref=e23]:
        - generic [ref=e24]: TOO LOW
        - generic [ref=e25]: "--"
        - generic [ref=e26]: TOO HIGH
      - paragraph [ref=e27]: TAP TO START TUNING
      - generic [ref=e28]: "--"
      - paragraph
      - generic [ref=e30]:
        - paragraph [ref=e31]: Target E2 · ±3 ct · A4 = 432.5 Hz
        - progressbar "String tuning confirmation" [ref=e32]
    - generic [ref=e33]:
      - region "String and drum targets" [ref=e34]:
        - group "electric guitar headstock with 6 playable tuning pegs" [ref=e35]:
          - text: KINS
          - button "Target string E2" [pressed] [ref=e72] [cursor=pointer]: E
          - button "Target string A2" [ref=e75] [cursor=pointer]: A
          - button "Target string D3" [ref=e78] [cursor=pointer]: D
          - button "Target string G3" [ref=e81] [cursor=pointer]: G
          - button "Target string B3" [ref=e84] [cursor=pointer]: B
          - button "Target string E4" [ref=e87] [cursor=pointer]: E
      - status [ref=e90]
    - generic [ref=e91]:
      - button "Start tuning" [ref=e92] [cursor=pointer]:
        - generic [ref=e96]: START TUNING
      - tablist "Instrument" [ref=e97]:
        - tab "ELECTRIC" [selected] [ref=e98] [cursor=pointer]
        - tab "ACOUSTIC" [ref=e103] [cursor=pointer]
        - tab "BASS" [ref=e109] [cursor=pointer]
        - tab "DRUMS" [ref=e115] [cursor=pointer]
      - text: 
  - dialog "Tuner settings" [ref=e122]:
    - button "Close tuner settings" [ref=e123] [cursor=pointer]: ×
    - region "Settings" [ref=e125]:
      - paragraph: SETTINGS
      - paragraph [ref=e126]: INSTRUMENT
      - radiogroup "Instrument" [ref=e127]:
        - radio "ELECTRIC" [checked] [ref=e128] [cursor=pointer]
        - radio "ACOUSTIC" [ref=e129] [cursor=pointer]
        - radio "BASS" [ref=e130] [cursor=pointer]
        - radio "DRUMS" [ref=e131] [cursor=pointer]
      - paragraph [ref=e132]: MODE
      - radiogroup "Mode" [ref=e133]:
        - radio "GUIDED" [checked] [ref=e134] [cursor=pointer]
        - radio "FREE" [ref=e135] [cursor=pointer]
        - radio "EAR TRAINING Tap a peg. Listen. Match by ear." [ref=e136] [cursor=pointer]:
          - text: EAR TRAINING
          - generic [ref=e137]: Tap a peg. Listen. Match by ear.
      - paragraph [ref=e138]: SETUP
      - button "STRINGS 6 STRINGS" [ref=e141] [cursor=pointer]:
        - generic [ref=e142]: STRINGS
        - generic [ref=e143]: 6 STRINGS
      - generic [ref=e146]:
        - generic [ref=e147]: Reference A4 (Hz)
        - generic [ref=e148]:
          - spinbutton "Reference A4 (Hz)" [ref=e149]: "432.5"
          - button "Reset 440" [ref=e150] [cursor=pointer]
        - generic [ref=e151]: In-tune tolerance
        - combobox "In-tune tolerance" [ref=e152]:
          - option "Standard · ±3 cents" [selected]
          - option "Precision · ±1 cent"
        - generic [ref=e153]: Microphone / audio interface
        - combobox "Microphone / audio interface" [ref=e154]:
          - option "System default" [selected]
        - generic [ref=e155]: Input channel
        - combobox "Input channel" [ref=e156]:
          - option "Channel 1" [selected]
          - option "Channel 2"
      - paragraph [ref=e157]:
        - text: "Recorded guitar sounds:"
        - link "tonejs-instruments · Nicholaus P. Brosowsky" [ref=e158] [cursor=pointer]:
          - /url: https://github.com/nbrosowsky/tonejs-instruments
        - text: (
        - link "CC BY 3.0" [ref=e159] [cursor=pointer]:
          - /url: https://creativecommons.org/licenses/by/3.0/
        - text: "). Acoustic: University of Iowa. Electric & bass: Karoryfer. Pitch-adjusted for your tuning."
      - paragraph [ref=e160]: TUNING BEHAVIOR
      - generic [ref=e161]:
        - generic [ref=e162] [cursor=pointer]:
          - checkbox "AUTO-ADVANCE NEXT STRING" [ref=e163]
          - generic [ref=e166]: AUTO-ADVANCE NEXT STRING
        - generic [ref=e167] [cursor=pointer]:
          - checkbox "AUTO STRING SELECT (FOLLOW PLUCK)" [ref=e168]
          - generic [ref=e171]: AUTO STRING SELECT (FOLLOW PLUCK)
      - button "Copy Tuner link" [ref=e173] [cursor=pointer]:
        - generic [ref=e174]:
          - generic [ref=e175]: 
          - generic [ref=e176]: Share Tuner
        - generic [ref=e177]: Copy
      - generic [ref=e178]:
        - generic [ref=e179]:
          - button "Light Mode" [ref=e180] [cursor=pointer]:
            - generic [ref=e181]: 
          - generic [ref=e182]:
            - generic [ref=e183]: 
            - generic [ref=e184]: "@2026 KINS."
          - button "Dark Mode" [pressed] [ref=e185] [cursor=pointer]:
            - generic [ref=e186]: 
        - navigation "Legal & Feedback Links" [ref=e187]:
          - link "HOME" [ref=e188] [cursor=pointer]:
            - /url: /
          - generic [ref=e189]: •
          - button "FEEDBACK" [ref=e190] [cursor=pointer]
          - generic [ref=e191]: •
          - button "LEGAL" [ref=e192] [cursor=pointer]
```