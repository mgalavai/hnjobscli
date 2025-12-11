# VHS Tape for HN Jobs CLI Demo
# Install vhs: brew install vhs
# Run: vhs demo.tape

Output demo.gif

Set FontSize 16
Set Width 1200
Set Height 800
Set Padding 20
Output demo.gif

Set FontSize 16
Set Width 1200
Set Height 800
Set Padding 20
Set WindowBar Colorful
Set BorderRadius 10
# Remove specific font family to fallback to system default which is usually safe
Set Theme "Catppuccin Mocha"

# Start the CLI
Type "npm run dev -- --fetch"
Enter

# Wait for fetch
Sleep 5s

# Explore
Type "Tab"
Sleep 1s
Type "1" 
Sleep 1s
Type "2"
Sleep 2s
Type "Tab"
Sleep 500ms

# Navigate Details
Down@300ms 10
Sleep 1s
Screenshot screenshot.png
Right 
Sleep 2s
Right
Sleep 2s

# Quit
Type "q"
