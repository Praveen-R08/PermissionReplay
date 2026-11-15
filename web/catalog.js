const catalog = `
Location|Device|Prompt|Find nearby events|Location updates|Coordinates 33.7490, −84.3880|Use ZIP code 30303
Camera|Media|Prompt|Try on glasses virtually|Camera video stream|Frames from a mock try-on|Use a built-in avatar
Microphone|Media|Prompt|Transcribe a voice note|Microphone audio stream|Samples from a mock recording|Type a note
Screen sharing|Media|Picker|Present a slide deck|Selected tab or window stream|Pixels from the selected presentation tab|Upload the slides
Screen audio|Media|Picker|Share sound with a presentation|Audio from a selected capture source|Mock audio from the selected tab|Share slides without audio
Captured surface control|Media|Prompt|Scroll a shared tab from a presentation tool|Control of the selected shared tab|Scroll action in the selected tab|Scroll in the original tab
Camera pan, tilt and zoom|Media|Prompt|Control a conference camera|Supported camera positioning controls|A mock zoom adjustment|Adjust the camera manually
Speaker selection|Media|Picker|Send conference audio to headphones||Selected headset output|Use system default output
Picture-in-picture|Media|Action|Open a floating video window||Video in a floating window|Keep the video in its tab
Automatic picture-in-picture|Media|Setting|Keep a call visible while switching tabs||Floating call window|Open the window manually
Fullscreen|Media|Action|Present a video or presentation||Fullscreen presentation|Stay in the normal layout
Autoplay and sound|Media|Setting|Play media on page load||Playback allowed under browser rules|Press play
Screen wake lock|Media|Action|Keep a recipe visible||Screen stays awake while the lock is active|Use device display settings
Protected media playback|Media|Setting|Play licensed video||Playback authorization or device identifier, where supported|Use an unprotected preview
Notifications|Background|Prompt|Show delivery alerts||Ability to display browser notifications|Check alerts in the site
Push messages|Background|Prompt|Receive updates in the background||Push subscription endpoint and keys|Check the site for updates
Background sync|Background|Setting|Retry an offline update||A queued task runs after reconnection|Retry while the page is open
Periodic background sync|Background|Setting|Refresh content in the background||A scheduled refresh runs if eligible|Refresh manually
Background fetch|Background|Action|Continue a large download||Background transfer and progress entry|Keep the tab open during download
Clipboard read|Files & data|Prompt|Paste a tracking number||Sample clipboard text: DEMO-2048|Type the tracking number
Clipboard write|Files & data|Action|Copy a share link||Sample link written to the clipboard|Select and copy the link
File upload|Files & data|Picker|Attach a profile photo||Only the selected example.png file|Choose a built-in image
File system read|Files & data|Picker|Open a local document|Access to the selected file handle|Contents of sample.txt|Paste selected text
File system write|Files & data|Picker|Edit or save a local document|Write access to the selected file if granted|Modified sample.txt|Download a new copy
Directory access|Files & data|Picker|Open a project folder|Access to the selected directory handle|Example project folder contents|Select individual files
Automatic downloads|Files & data|Setting|Save several exported images||Multiple sample downloads initiated|Download one ZIP
Local fonts|Files & data|Prompt|Choose a font in a design app||Installed font names or permitted font data|Use bundled fonts
Contacts|Files & data|Picker|Select a person to invite||Selected fields from a sample contact|Type the address
Persistent storage|Files & data|Prompt|Keep offline workspace data||Origin storage gains protection against eviction|Export an offline backup
Embedded storage access|Files & data|Prompt|Sign in inside an embedded widget|Access to eligible unpartitioned storage|Sample sign-in cookie becomes available to the embedded origin|Open the service directly
Top-level storage access|Files & data|Prompt|Request storage access for an embedded service|Eligible storage access for a related embedded origin|Mock cookie access for the related origin|Open the service directly
Cookies and site data|Files & data|Setting|Remember preferences across visits||Example preference cookie stored or read|Keep settings for this visit
FedCM sign-in|Identity|Picker|Sign in with an identity provider||An identity credential for the selected account|Use the site's own sign-in
Passkeys|Identity|Picker|Sign in with a passkey||Signed authentication response|Use another sign-in method
Identity documents|Identity|Picker|Verify age with a digital credential||Selected credential claims, such as over 18|Use another verification method
Payment request|Identity|Picker|Pay for an order||Approved payment response and requested fields|Use manual checkout
Payment handler|Identity|Setting|Register a web payment app||Payment method registered for supported checkout flows|Use a conventional checkout
Bluetooth|Device|Picker|Connect a heart-rate sensor|Connection to selected services on one device|Mock heart-rate measurement|Enter the reading manually
USB|Device|Picker|Connect a lab instrument|Access to the selected USB interface|Mock measurement from the chosen instrument|Import a measurement file
Serial port|Device|Picker|Connect a microcontroller|Access to the chosen serial port|Mock serial output from a controller|Import a log file
HID device|Device|Picker|Use a custom controller|Reports from the selected HID device|Mock button report|Use keyboard controls
MIDI|Device|Prompt|Play a web synthesizer|MIDI messages on available ports|Mock note-on message|Play with on-screen keys
MIDI system exclusive|Device|Prompt|Configure a supported synthesizer|Additional manufacturer-specific MIDI messaging|Mock preset response|Use the hardware controls
NFC|Device|Prompt|Read a nearby NFC tag|NFC reads during the scan|Mock tag record|Enter the tag ID
Local network|Device|Prompt|Connect to a printer over Wi-Fi|Requests to eligible local network targets|Mock printer status response|Upload an exported status report
Loopback network|Device|Prompt|Connect to a companion app on this device|Requests to an eligible local service|Mock companion service response|Use the standalone web workflow
Accelerometer|Sensors|Setting|Measure movement|Acceleration samples|Mock x, y and z readings|Use on-screen controls
Gyroscope|Sensors|Setting|Measure rotation|Angular velocity samples|Mock rotation rates|Use on-screen controls
Magnetometer|Sensors|Setting|Show compass heading|Magnetic field samples|Mock magnetic field reading|Enter a heading manually
Ambient light|Sensors|Setting|Adjust display contrast|Light sensor readings|Mock 240 lux measurement|Set the theme manually
Device motion and orientation|Sensors|Prompt|Steer a game by tilting the phone|Motion or orientation events|Mock tilt angles|Use arrow keys
Compute pressure|Sensors|Setting|Reduce animation during heavy CPU load|Coarse CPU pressure updates|Sample state: fair|Use a fixed performance mode
Virtual reality|Sensors|Action|Enter a virtual showroom|Headset poses and controller inputs|Mock headset pose|Use the desktop viewer
Augmented reality|Sensors|Action|Place furniture in a room|Supported spatial tracking and input|Mock surface position|Use the desktop model viewer
Window management|Browser|Prompt|Place windows on multiple monitors|Screen layout and placement information|Mock monitor dimensions and arrangement|Position windows yourself
Pop-ups and redirects|Browser|Setting|Open an invoice in a new window||New invoice window opened|Open the invoice in the current tab
Pointer lock|Browser|Action|Control a first-person game|Relative mouse movement while locked|Mock mouse delta|Use click and drag
Keyboard lock|Browser|Action|Capture game shortcuts in fullscreen|Keys capturable under browser rules|Mock game shortcut|Use ordinary game controls
Idle detection|Browser|Prompt|Show an away status|Idle and screen lock state changes|Sample state: idle, screen locked|Set your status manually
Protocol handlers|Browser|Prompt|Open email links in a webmail site||The site registers to handle supported links|Copy the email address
App installation|Browser|Action|Install a web app shortcut||Installed app entry or shortcut|Keep using the browser tab
Web Share|Browser|Picker|Send a page to another app||Selected share destination receives the sample URL|Copy the link manually
JavaScript|Browser|Setting|Run a site's interactive features||Site scripts can run under browser rules|Use a static page when available
Images|Browser|Setting|Load page images||An external image request may be sent|View text only
Intrusive ads|Browser|Setting|Manage how a site shows ads||Ad display governed by browser settings|Use available browser restrictions
Insecure content|Browser|Setting|Load a legacy resource from a secure page||Insecure resource loads only where allowed|Use a secure version of the resource
File handlers|Browser|Prompt|Open a supported file type with an installed web app||Selected file is passed to the chosen app|Open the app and choose the file
Web printing|Browser|Picker|Print a document||Selected destination receives the print job|Download a PDF
Media device listing|Media|Setting|List available input and output devices||Eligible device names or identifiers|Use the default device
Gamepad|Device|Action|Play using a connected controller|Controller button and axis updates|Mock joystick position|Use keyboard controls
Vibration|Device|Action|Give feedback during a game||A mock vibration command is triggered|Use visual feedback
`.trim().split('\n').map((record,index)=>{
 const [name,category,type,purpose,live,sample,alternative]=record.split('|');
 return {id:name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name,category,type,purpose,live,sample,alternative,index};
});
