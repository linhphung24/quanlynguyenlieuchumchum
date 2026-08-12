@echo off
echo ====================================================================
echo DONG GOI UNG DUNG CHUM CHUM BAKERY WINFORMS PORTABLE (SINGLE FILE .EXE)
echo ====================================================================

dotnet publish d:\source_code\quanlynguyenlieuchumchum_new\winforms\ChumChumBakery.WinForms\ChumChumBakery.WinForms.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:EnableCompressionInSingleFile=true -o d:\source_code\quanlynguyenlieuchumchum_new\winforms\publish_portable

echo.
echo ====================================================================
echo DONG GOI PORTABLE HOAN TAT TAI: d:\source_code\quanlynguyenlieuchumchum_new\winforms\publish_portable
echo ====================================================================
pause
