[MIG Progress Spring MVC 예제 프로젝트 설명]

1. 프로젝트 목적
- Spring MVC 어노테이션 기반 구조 학습 및 화면 테스트
- Controller / Service / Repository 분리
- DB 연결 전에도 FakeRepository 로 화면 확인 가능
- 새로고침마다 전체 로그 1회 조회
- 프론트(JS)에서 통계 계산 및 그리드 동적 생성

2. 현재 구조
- Controller
  - MigProgressController
- Service
  - MigProgressService
  - MigProgressServiceImpl
- Repository
  - MigProgressRepository
  - MigProgressFakeRepository
- View
  - migProgress.jsp
- Static
  - migProgress.js
  - migProgress.css

3. 주요 URL
- 화면 진입
  /프로젝트컨텍스트/mig/progress/view.do
- 전체 로그 JSON
  /프로젝트컨텍스트/mig/progress/all.do

4. Eclipse 에서 어떤 프로젝트로 만드는 게 맞나?
[권장]
- Maven Project 로 생성
- packaging = war
- 이후 Project Facets 에서 Dynamic Web Module 체크

이유:
- 사내 Nexus 만 연결되면 dependency 관리가 편함
- Spring / Jackson / JSTL 버전 변경 대응이 쉬움
- 나중에 DB Driver 추가도 pom.xml 로 관리 가능

[비권장이지만 가능]
- Dynamic Web Project 로 생성 후 lib 수동 복사

문제점:
- jar 누락/충돌 찾기 어려움
- 버전 변경 시 관리 지옥
- spring-beans, spring-core, spring-context, spring-web, spring-webmvc, jackson 등
  연관 jar 를 전부 수동으로 맞춰야 함

5. 폐쇄망에서 반드시 확인할 것
(1) 사내 Nexus 가 있는지
- Maven settings.xml 에 사내 Nexus mirror 설정이 가능한지 확인

(2) 사내 Nexus 에 아래 artifact 들이 존재하는지
- org.springframework:spring-webmvc
- org.springframework:spring-context
- com.fasterxml.jackson.core:jackson-databind
- jstl:jstl
- javax.servlet:javax.servlet-api
- maven-war-plugin

(3) JDK 버전
- pom.xml 의 source/target 과 서버 JDK 가 맞아야 함

(4) Tomcat 버전
- Servlet API 버전과 맞춰야 함
- 예: Tomcat 9 계열이면 servlet-api 4.x 사용 가능

6. Eclipse 에서 실제 생성 추천 순서
[가장 추천]
1) File > New > Maven Project
2) Group Id: mig.progress
3) Artifact Id: mig-progress-springmvc
4) Packaging: war
5) pom.xml 을 이 예제처럼 수정
6) Maven Update 실행
7) Project Facets 에서 Dynamic Web Module / Java 체크
8) Tomcat Runtime 연결
9) Run on Server

7. 만약 폐쇄망이라 Maven 다운로드가 안 되면?
선택지는 두 개다.
- A. 사내 Nexus mirror 설정부터 해결
- B. Dynamic Web Project 로 만들고 WEB-INF/lib 에 jar 수동 반입

실무적으로는 A 가 훨씬 낫다.

8. 나중에 DB 붙일 때 바꿀 부분
- MigProgressFakeRepository 대신 DB Repository 구현체 추가
- MigProgressRepository 인터페이스는 그대로 사용
- Service / Controller / JSP / JS 는 대부분 유지 가능

9. 최초 확인 포인트
- /mig/progress/view.do 접속되는지
- 브라우저 개발자도구 Network 탭에서 /mig/progress/all.do 가 200 인지
- JSON 으로 로그 1000건이 오는지
- 화면이 자동 새로고침 되는지
