#!/bin/sh

# Disable service
sudo rm ./install.sh

# Disable service
systemctl stop xornet
echo "Xornet service stopped!"
systemctl disable xornet
echo "Xornet service disabled!"

# Delete all files
sudo rm -rf /etc/xornet
sudo rmdir /etc/xornet
sudo rm /etc/systemd/system/xornet.service
echo "Xornet uninstalled!"

# Create folder again
mkdir /etc/xornet

# Download
wget "https://github.com/Geoxor/Xornet/releases/download/v0.0.18/xornet-reporter-linux-v0.0.18.bin" -P /etc/xornet
chmod +x /etc/xornet/xornet-reporter-linux-v0.0.18.bin
echo "Xornet reporter downloaded!"

# Download service
sudo wget "https://cdn.discordapp.com/attachments/808856125817618532/855074876892250162/xornet.service" -P /etc/systemd/system
systemctl enable xornet
echo "Xornet service downloaded!"

# Register service
systemctl start xornet
systemctl status xornet
echo "Xornet install finished!"