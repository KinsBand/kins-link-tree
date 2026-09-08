# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier1-smoke\metronome.spec.ts >> tier1 smoke — metronome >> background play keeps the engine running across visibility changes
- Location: e2e\tier1-smoke\metronome.spec.ts:472:3

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- main [ref=f2e2]:
  - generic [ref=f2e3]:
    - generic [ref=f2e4]:
      - link "Back to KINS home" [ref=f2e5] [cursor=pointer]:
        - /url: /
        - generic [ref=f2e6]: 
        - generic [ref=f2e7]: KINS!
      - text: 
      - button "Open settings" [ref=f2e8] [cursor=pointer]:
        - generic [ref=f2e9]: 
    - region "Tempo (drag or scroll to adjust)" [ref=f2e10]:
      - group "Beat pitch selectors — tap to cycle Low/Mid/High/Mute":
        - button "Beat 1 — pitch mid" [ref=f2e11] [cursor=pointer]
        - button "Beat 2 — pitch mid" [ref=f2e12] [cursor=pointer]
        - button "Beat 3 — pitch mid" [ref=f2e13] [cursor=pointer]
        - button "Beat 4 — pitch mid" [ref=f2e14] [cursor=pointer]
      - generic [ref=f2e15]:
        - generic: Allegro
        - button "Tempo 120 BPM — tap to edit, drag dial or use arrow keys to adjust" [ref=f2e17] [cursor=pointer]: "120"
        - paragraph [ref=f2e18]: BPM
        - generic [ref=f2e19]:
          - button "4/4" [ref=f2e20] [cursor=pointer]:
            - generic [ref=f2e22]: 
          - button "1/4" [ref=f2e24] [cursor=pointer]:
            - generic [ref=f2e26]: 
    - generic [ref=f2e28]:
      - button "Open setlist" [ref=f2e29] [cursor=pointer]:
        - generic [ref=f2e30]: 
      - text: 
      - button "TAP TEMPO" [ref=f2e31] [cursor=pointer]
      - button "Start metronome" [active] [ref=f2e32] [cursor=pointer]:
        - generic [ref=f2e33]: 
        - text: 
    - button "COACH DECK" [ref=f2e35] [cursor=pointer]
    - text:    
  - text:           +           +                          +       +  
```