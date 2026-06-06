# 🚀 Running Genshindle Helper

The CSV auto-load feature requires serving files through HTTP/HTTPS, not opening the HTML file directly with `file://` protocol.

## Quick Start (Recommended)

### Option 1: Python (Built-in)

If you have Python installed:

```bash
# Python 3.x
python -m http.server 8000

# Python 2.x
python -m SimpleHTTPServer 8000
```

Then open: **http://localhost:8000**

### Option 2: Node.js / npx (No install needed)

```bash
npx http-server
```

Then open the URL shown (usually http://localhost:8080)

### Option 3: VS Code Live Server Extension

1. Install [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension
2. Right-click `index.html` → "Open with Live Server"

### Option 4: Node.js Express (If you have Node.js)

```bash
npm install express
node -e "require('express')().use(require('express').static('.')).listen(3000, () => console.log('Server at http://localhost:3000'))"
```

## Troubleshooting

**Still seeing the error?**

1. **Open browser console** (F12) and check for error messages
2. **Verify the file exists**: Make sure `List Genshin Impact Characters.csv` is in the project root
3. **Check the server is running**: Verify you're accessing via `http://` or `https://`, not `file://`
4. **File permissions**: Ensure the CSV file is readable

**Quick file check:**
```powershell
# In PowerShell at project root:
Test-Path ".\List Genshin Impact Characters.csv"
Get-Item ".\List Genshin Impact Characters.csv" | Select-Object FullName, Length
```

## Why This is Needed

- **Security**: Browsers block `fetch()` requests from `file://` protocol (CORS policy)
- **Solution**: Serve through a local HTTP server
- **Benefit**: Also enables auto-loading of assets.js and proper asset loading

---

**Recommended:** Use Python (Option 1) as it requires no additional installation! 🎮
