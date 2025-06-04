    function generateBTQ() {
      const content = `REM **** Flashlogs BTQ
set _m_user_appdata=%appdata%
set _m_outputdir=C:\\poscopy
set _m_datetime=%date%_%time%
set _m_datetime=%_m_datetime: =_%
set _m_datetime=%_m_datetime::=%
set _m_datetime=%_m_datetime:/=_% 
set _m_datetime=%_m_datetime:.=_% 
if exist %_m_outputdir% (echo "Exists") else (mkdir %_m_outputdir%)
copy /b "%_m_user_appdata%\\Macromedia\\Flash Player\\Logs\\flashlog.txt" %_m_outputdir%\\WPOS_%_m_datetime%.txt
copy /b "%_m_user_appdata%\\ipbtq.74249FF9CB321F1D45F6EA93A89630D1BE111EF2.1\\Local Store\\iportfolio.log" %_m_outputdir%\\iportfolio_%_m_datetime%.log
copy /b "%_m_user_appdata%\\ipbtq.74249FF9CB321F1D45F6EA93A89630D1BE111EF2.1\\Local Store\\iportfolio.xml" %_m_outputdir%\\iportfolio_%_m_datetime%.xml`;
      downloadFile(content, 'Flashlogs_BTQ.bat');
    }

    function generateFB() {
      const content = `REM **** Flashlogs FB
set _m_user_appdata=%appdata%
set _m_outputdir=C:\\poscopy
set _m_datetime=%date%_%time%
set _m_datetime=%_m_datetime: =_%
set _m_datetime=%_m_datetime::=%
set _m_datetime=%_m_datetime:/=_% 
set _m_datetime=%_m_datetime:.=_% 
if exist %_m_outputdir% (echo "Exists") else (mkdir %_m_outputdir%)
copy /b "%_m_user_appdata%\\Macromedia\\Flash Player\\Logs\\flashlog.txt" %_m_outputdir%\\WPOS_%_m_datetime%.txt
copy /b "%_m_user_appdata%\\ipfb.74249FF9CB321F1D45F6EA93A89630D1BE111EF2.1\\Local Store\\iportfolio.log" %_m_outputdir%\\iportfolio_%_m_datetime%.log
copy /b "%_m_user_appdata%\\ipfb.74249FF9CB321F1D45F6EA93A89630D1BE111EF2.1\\Local Store\\iportfolio.xml" %_m_outputdir%\\iportfolio_%_m_datetime%.xml`;
      downloadFile(content, 'Flashlogs_FB.bat');
    }

    function downloadFile(content, filename) {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }