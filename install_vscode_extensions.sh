#!/bin/bash
echo "Installing VSCode extensions for Expo/React Native development..."

# Essential extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-json
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension ms-python.python
code --install-extension ms-vscode.vscode-node-azure-pack
code --install-extension formulahendry.auto-rename-tag
code --install-extension christian-kohler.path-intellisense
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension expo.vscode-expo-tools

# React Native specific
code --install-extension msjsdiag.vscode-react-native

echo "Extensions installed successfully!"
