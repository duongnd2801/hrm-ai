@REM Maven Wrapper startup batch script for Windows
@SETLOCAL

@SET MAVEN_PROJECTBASEDIR=%~dp0
@IF NOT "%MAVEN_BASEDIR%"=="" @SET MAVEN_PROJECTBASEDIR=%MAVEN_BASEDIR%

@SET WRAPPER_JAR="%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.jar"
@SET WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

@IF "%JAVA_HOME%"=="" (
  @SET JAVA_CMD="C:\Program Files\Java\jdk-21\bin\java.exe"
) ELSE (
  @SET JAVA_CMD="%JAVA_HOME%\bin\java.exe"
)

%JAVA_CMD% -cp %WRAPPER_JAR% -Dmaven.multiModuleProjectDirectory="%MAVEN_PROJECTBASEDIR%." %WRAPPER_LAUNCHER% %*
@IF "%ERRORLEVEL%"=="0" GOTO end
@EXIT /B 1
:end
@ENDLOCAL
