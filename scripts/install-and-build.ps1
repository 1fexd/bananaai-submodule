# This is used in a task in .vscode/tasks.json when on windows
# Start developing with:
# - Run Task -> Install Dependencies
# - Debug -> Extension

# Everything needs node and npm
Write-Host "`nChecking for dependencies that may require manual installation...`n" -ForegroundColor White

# $cargo = (get-command cargo -ErrorAction SilentlyContinue)
# if ($null -eq $cargo) {
#     Write-Host "Not Found " -ForegroundColor Red -NoNewLine
#     Write-Host "cargo"
# } else {
#     Write-Host "Found " -ForegroundColor Green -NoNewLine
#     & cargo --version
# }

$node  = (get-command node -ErrorAction SilentlyContinue)
if ($null -eq $node) {
    Write-Host "Not Found " -ForegroundColor Red -NoNewLine
    Write-Host "node"
} else {
    Write-Host "Found " -ForegroundColor Green -NoNewLine
    Write-Host "node "  -NoNewLine
    & node --version
}

# if ($null -eq $cargo) {
#     Write-Host "`n...`n"
#     Write-Host "Cargo`n" -ForegroundColor  White
#     Write-Host "Doesn't appear to be installed or is not on your Path."
#     Write-Host "For how to install cargo see:" -NoNewline
#     Write-Host "https://doc.rust-lang.org/cargo/getting-started/installation.html" -ForegroundColor Green
# }

if ($null -eq $node) {
    Write-Host "`n...`n"
    Write-Host "NodeJS`n" -ForegroundColor White
    Write-Host "Doesn't appear to be installed or is not on your Path."
    Write-Host "On most Windows systems you can install node using: " -NoNewLine
    Write-Host "winget install OpenJS.NodeJS.LTS " -ForegroundColor Green
    Write-Host "After installing restart your Terminal to update your Path."
    Write-Host "Alternatively see: " -NoNewLine
    Write-Host "https://nodejs.org/" -ForegroundColor Yellow
}

if (($null -eq $node)) {
    return "`nSome dependencies that may require installation could not be found. Exiting"
}

Write-Host "`nInstalling Core extension dependencies..." -ForegroundColor White
Push-Location core
npm install
npm link
Pop-Location

Write-Output "`nInstalling GUI extension dependencies..." -ForegroundColor White
Push-Location gui
npm install
npm link @pearai/core
npm run build
Pop-Location

# VSCode Extension (will also package GUI)
Write-Output "`nInstalling VSCode extension dependencies..." -ForegroundColor White
Push-Location extensions/vscode

# This does way too many things inline but is the common denominator between many of the scripts
npm install
npm link @pearai/core
npm run prepackage
npm run package

Pop-Location


Write-Output "`nInstalling binary dependencies..." -ForegroundColor White
Push-Location binary

npm install
npm run build

Pop-Location

Write-Output "`nInstalling docs dependencies..." -ForegroundColor White
Push-Location docs

npm install
