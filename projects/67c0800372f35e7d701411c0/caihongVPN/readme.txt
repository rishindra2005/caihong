SMB 2TB FS IP 10.0.3.4

$connectTestResult = Test-NetConnection -ComputerName caihong.file.core.windows.net -Port 445
if ($connectTestResult.TcpTestSucceeded) {
    # Save the password so the drive will persist on reboot
    cmd.exe /C "cmdkey /add:`"caihong.file.core.windows.net`" /user:`"localhost\caihong`" /pass:`"rQI0ljgQHdRd7/W6cz7rPJKipZNh2Awk7/r9eRkZhqfpqOf4zquP0uH/8ZlNKYeUoinXf/OntTL4+AStybb0wA==`""
    # Mount the drive
    New-PSDrive -Name Z -PSProvider FileSystem -Root "\\caihong.file.core.windows.net\caihong" -Persist
} else {
    Write-Error -Message "Unable to reach the Azure storage account via port 445. Check to make sure your organization or ISP is not blocking port 445, or use Azure P2S VPN, Azure S2S VPN, or Express Route to tunnel SMB traffic over a different port."
}