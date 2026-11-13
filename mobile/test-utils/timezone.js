// Jest globalSetup. 날짜를 기기 시간대로 적는 화면(src/record/summary.ts)을 어디서 돌려도 같은 값으로 보려고
// 테스트는 서울 시간대로 고정한다. 테스트 워커가 뜨기 전에 정해야 해서 globalSetup에 둔다.
module.exports = async () => {
  process.env.TZ = 'Asia/Seoul';
};
