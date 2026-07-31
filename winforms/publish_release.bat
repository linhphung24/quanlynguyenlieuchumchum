@echo off
echo ====================================================================
echo DONG GOI UNG DUNG CHUM CHUM BAKERY WINFORMS CHO MANG LAN
echo ====================================================================

dotnet publish d:\source_code\quanlynguyenlieuchumchum_new\winforms\ChumChumBakery.WinForms\ChumChumBakery.WinForms.csproj -c Release -r win-x64 --self-contained false -o d:\source_code\quanlynguyenlieuchumchum_new\winforms\publish_release

echo.
echo ====================================================================
echo DONG GOI HOAN TAT TA I: d:\source_code\quanlynguyenlieuchumchum_new\winforms\publish_release
echo ====================================================================
pause
