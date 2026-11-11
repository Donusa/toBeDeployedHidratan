@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
if errorlevel 1 exit /b 1

rem Configuracion local. Se respetan las variables ya definidas en el entorno.
rem MySQL local: puerto 3306. La contrasena se solicita al iniciar.
if not defined SPRING_DATASOURCE_URL set "SPRING_DATASOURCE_URL=jdbc:mysql://127.0.0.1:3306/hidratan?createDatabaseIfNotExist=true&serverTimezone=UTC"
if not defined SPRING_DATASOURCE_USERNAME set "SPRING_DATASOURCE_USERNAME=root"
rem Clave JWT solo para desarrollo local y correo sin credenciales reales.
if not defined SECRET_KEY set "SECRET_KEY=aGlkcmF0YW4tbG9jYWwtZGV2ZWxvcG1lbnQta2V5LTMyaGV4LW9ubHk="
if not defined MAIL_SENDER set "MAIL_SENDER=local@localhost"
if not defined MAIL_SENDER_PASSWORD set "MAIL_SENDER_PASSWORD=local"

if /i "%~1"=="backend" goto backend
if /i "%~1"=="frontend" goto frontend

echo Iniciando Hidratan en local...
echo MySQL debe estar iniciado. La configuracion esta al comienzo de este archivo.
echo.

where node.exe >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado o no esta en PATH.
    goto error
)
where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm no esta instalado o no esta en PATH.
    goto error
)
call :java
if errorlevel 1 goto error
call :password
if errorlevel 1 goto error

start "Hidratan - Backend" /d "%~dp0backend" "%ComSpec%" /k call "%~f0" backend
if errorlevel 1 goto error
start "Hidratan - Frontend" /d "%~dp0frontend" "%ComSpec%" /k call "%~f0" frontend
if errorlevel 1 goto error

echo Frontend: http://localhost:4200
echo Backend:  http://localhost:9000
echo El navegador se abrira cuando Angular termine de iniciar.
echo Para detener la app, presiona Ctrl+C en las dos ventanas.
exit /b 0

:backend
call :java
if errorlevel 1 goto error
call :password
if errorlevel 1 goto error
cd /d "%~dp0backend"
if errorlevel 1 goto error
where mvn.cmd >nul 2>&1
if errorlevel 1 goto wrapper
call mvn.cmd spring-boot:run
exit /b %errorlevel%

:wrapper
call mvnw.cmd spring-boot:run
exit /b %errorlevel%

:frontend
cd /d "%~dp0frontend"
if errorlevel 1 goto error
if exist "node_modules\.bin\ng.cmd" goto serve
echo Instalando dependencias del frontend...
call npm.cmd ci
if errorlevel 1 goto error

:serve
call npm.cmd start -- --configuration development --host 127.0.0.1 --port 4200 --open
exit /b %errorlevel%

:java
rem Preferir JDK 17 si JAVA_HOME no esta definido: el PATH puede usar otro Java.
if not defined JAVA_HOME (
    for /d %%J in ("%ProgramFiles%\Java\jdk-17*" "%ProgramFiles%\Eclipse Adoptium\jdk-17*") do (
        if exist "%%~fJ\bin\javac.exe" set "JAVA_HOME=%%~fJ"
    )
)
if defined JAVA_HOME (
    if not exist "%JAVA_HOME%\bin\javac.exe" (
        echo ERROR: JAVA_HOME debe apuntar a un JDK. Se recomienda JDK 17.
        exit /b 1
    )
    set "PATH=%JAVA_HOME%\bin;%PATH%"
)
where javac.exe >nul 2>&1
if errorlevel 1 (
    echo ERROR: Instala JDK 17 y configura JAVA_HOME.
    exit /b 1
)
exit /b 0

:password
if defined SPRING_DATASOURCE_PASSWORD exit /b 0
echo Usuario de MySQL: %SPRING_DATASOURCE_USERNAME%
for /f "usebackq delims=" %%P in (`powershell.exe -NoProfile -Command "$secret = Read-Host 'Contrasena de MySQL local' -AsSecureString; [System.Net.NetworkCredential]::new('', $secret).Password"`) do set "SPRING_DATASOURCE_PASSWORD=%%P"
if not defined SPRING_DATASOURCE_PASSWORD (
    echo ERROR: Debes ingresar la contrasena de MySQL local.
    exit /b 1
)
exit /b 0

:error
echo.
echo No se pudo iniciar la app. Revisa el error indicado arriba.
pause
exit /b 1
