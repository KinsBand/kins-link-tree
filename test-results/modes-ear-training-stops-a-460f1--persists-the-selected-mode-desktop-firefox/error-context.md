# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: modes.spec.ts >> ear training stops active capture and persists the selected mode
- Location: e2e\tuner\modes.spec.ts:64:1

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
      - button "Open tuner settings" [expanded] [ref=e15] [cursor=pointer]:
        - generic [ref=e16]: 
    - generic [ref=e17]:
      - region "String and drum targets" [ref=e18]:
        - group "electric guitar headstock with 6 playable tuning pegs" [ref=e19]:
          - text: KINS
          - button "Play reference for string 6" [pressed] [ref=e56] [cursor=pointer]: "6"
          - button "Play reference for string 5" [ref=e59] [cursor=pointer]: "5"
          - button "Play reference for string 4" [ref=e62] [cursor=pointer]: "4"
          - button "Play reference for string 3" [ref=e65] [cursor=pointer]: "3"
          - button "Play reference for string 2" [ref=e68] [cursor=pointer]: "2"
          - button "Play reference for string 1" [ref=e71] [cursor=pointer]: "1"
      - status [ref=e74]
    - generic [ref=e75]:
      - tablist "Instrument" [ref=e76]:
        - tab "ELECTRIC" [selected] [ref=e77] [cursor=pointer]
        - tab "ACOUSTIC" [ref=e82] [cursor=pointer]
        - tab "BASS" [ref=e88] [cursor=pointer]
        - tab "DRUMS" [ref=e94] [cursor=pointer]
      - text: 
  - dialog "Tuner settings" [ref=e101]:
    - button "Close tuner settings" [ref=e102] [cursor=pointer]: ×
    - region "Settings" [ref=e104]:
      - paragraph: SETTINGS
      - paragraph [ref=e105]: INSTRUMENT
      - radiogroup "Instrument" [ref=e106]:
        - radio "ELECTRIC" [checked] [ref=e107] [cursor=pointer]
        - radio "ACOUSTIC" [ref=e108] [cursor=pointer]
        - radio "BASS" [ref=e109] [cursor=pointer]
        - radio "DRUMS" [ref=e110] [cursor=pointer]
      - paragraph [ref=e111]: MODE
      - radiogroup "Mode" [ref=e112]:
        - radio "GUIDED" [ref=e113] [cursor=pointer]
        - radio "FREE" [ref=e114] [cursor=pointer]
        - radio "EAR TRAINING Tap a peg. Listen. Match by ear." [checked] [active] [ref=e115] [cursor=pointer]:
          - text: EAR TRAINING
          - generic [ref=e116]: Tap a peg. Listen. Match by ear.
      - paragraph [ref=e117]: SETUP
      - button "STRINGS 6 STRINGS" [ref=e120] [cursor=pointer]:
        - generic [ref=e121]: STRINGS
        - generic [ref=e122]: 6 STRINGS
      - generic [ref=e125]:
        - generic [ref=e126]: Reference A4 (Hz)
        - generic [ref=e127]:
          - spinbutton "Reference A4 (Hz)" [ref=e128]: "432.5"
          - button "Reset 440" [ref=e129] [cursor=pointer]
      - paragraph [ref=e130]:
        - text: "Recorded guitar sounds:"
        - link "tonejs-instruments · Nicholaus P. Brosowsky" [ref=e131] [cursor=pointer]:
          - /url: https://github.com/nbrosowsky/tonejs-instruments
        - text: (
        - link "CC BY 3.0" [ref=e132] [cursor=pointer]:
          - /url: https://creativecommons.org/licenses/by/3.0/
        - text: "). Acoustic: University of Iowa. Electric & bass: Karoryfer. Pitch-adjusted for your tuning."
      - button "Copy Tuner link" [ref=e134] [cursor=pointer]:
        - generic [ref=e135]:
          - generic [ref=e136]: 
          - generic [ref=e137]: Share Tuner
        - generic [ref=e138]: Copy
      - generic [ref=e139]:
        - generic [ref=e140]:
          - button "Light Mode" [ref=e141] [cursor=pointer]:
            - generic [ref=e142]: 
          - generic [ref=e143]:
            - generic [ref=e144]: 
            - generic [ref=e145]: "@2026 KINS."
          - button "Dark Mode" [pressed] [ref=e146] [cursor=pointer]:
            - generic [ref=e147]: 
        - navigation "Legal & Feedback Links" [ref=e148]:
          - link "HOME" [ref=e149] [cursor=pointer]:
            - /url: /
          - generic [ref=e150]: •
          - button "FEEDBACK" [ref=e151] [cursor=pointer]
          - generic [ref=e152]: •
          - button "LEGAL" [ref=e153] [cursor=pointer]
```