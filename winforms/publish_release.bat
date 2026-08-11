@echo off
echo ====================================================================
echo DONG GOI UNG DUNG CHUM CHUM BAKERY WINFORMS CHO MANG LAN
echo ====================================================================

dotnet publish .\ChumChumBakery.WinForms\ChumChumBakery.WinForms.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:IncludeAllContentForSelfExtract=true -o .\publish_release

echo.
echo ====================================================================
echo DONG GOI HOAN TAT TAI: %CD%\publish_release
echo ====================================================================
pause
