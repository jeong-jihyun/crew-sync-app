# CrewSync (Electron)
## 실행
    npm install
    npm start
## exe/dmg 만들기
    npm run dist
## 구글 시트 연결 (1회)
1. 구글 클라우드 콘솔 → Google Sheets API 사용 설정 → 서비스 계정 생성 → 키(JSON) 발급
2. 대상 시트를 그 계정의 client_email 에 '편집자'로 공유
3. 앱에서 시트 주소 입력 + JSON 선택 → '시험 실행(3편)'으로 확인 후 동기화
다시 누르면 시트에 없는 새 글만 추가됩니다.
