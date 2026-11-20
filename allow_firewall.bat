@echo off
chcp 65001 >nul
echo 正在為日和記帳 (連接埠 8000) 新增 Windows 防火牆允許連線規則...
echo (若出現 UAC 提權確認視窗，請點選「是」)
echo.
netsh advfirewall firewall add rule name="HiyoriBook_Port8000" dir=in action=allow protocol=TCP localport=8000
if %errorlevel% equ 0 (
    echo.
    echo ✅ 防火牆規則設定成功！手機現在可以正常連入 http://%LOCAL_IP%:8000 了。
) else (
    echo.
    echo ⚠️ 需要系統管理員權限。請對此檔案點擊右鍵 -> 選擇「以系統管理員身分執行」。
)
echo.
pause
