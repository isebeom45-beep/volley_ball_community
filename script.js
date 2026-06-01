// 초기 데이터셋 기동
const defaultTeams = [
    { id: 1, name: "구미 스파이크 브라더스", location: "경상북도 구미시", experience: "1년 미만", level: "초급", position: "올라운더", info: "이제 막 패스를 맞추기 시작한 뉴비 팀입니다. 주말 기본기 교류전 원해요!", manner: 98, contact: "010-1111-2222" },
    { id: 2, name: "볼리나인 (Volley-9)", location: "서울특별시 강남구", experience: "1~3년", level: "중급", position: "세터 중심", info: "퇴근 후 모이는 직장인 9인제 동호회입니다. 매너 플레이 보장합니다.", manner: 95, contact: "010-3333-4444" },
    { id: 3, name: "수원 V-클럽", location: "경기도 수원시", experience: "5년 이상", level: "상급", position: "공격수 다수", info: "전국 상위권 본선 타겟 남성부 동호회입니다. 타이트한 연습 경기 원합니다.", manner: 99, contact: "010-5555-6666" }
];

// 변수 엘리먼트 맵핑
const teamGridContainer = document.getElementById('team-grid-container');
const teamCountBadge = document.getElementById('team-count');
const teamModal = document.getElementById('team-modal');
const messageModal = document.getElementById('message-modal');
const teamRegisterForm = document.getElementById('team-register-form');
const messageSendForm = document.getElementById('message-send-form');

let currentMessageTarget = "";

// 탭 스위칭 컨트롤러
window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`content-${tabName}`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    if(tabName === 'mypage') {
        renderMyPage();
    }
}

// 스토리지 로더 모듈들
function getTeams() {
    if(!localStorage.getItem('v_teams')) localStorage.setItem('v_teams', JSON.stringify(defaultTeams));
    return JSON.parse(localStorage.getItem('v_teams'));
}
function getMyTeam() { return JSON.parse(localStorage.getItem('v_myteam')) || null; }
function getStats() {
    if(!localStorage.getItem('v_stats')) localStorage.setItem('v_stats', JSON.stringify({ attempts: 0, success: 0 }));
    return JSON.parse(localStorage.getItem('v_stats'));
}
function getContacts() { return JSON.parse(localStorage.getItem('v_contacts')) || []; }
function getMessages() { return JSON.parse(localStorage.getItem('v_messages')) || []; }

// 렌더링 파이프라인 엔진
function renderTeams(filtered) {
    const teams = filtered || getTeams();
    teamGridContainer.innerHTML = '';
    teamCountBadge.textContent = `총 ${teams.length}개 팀`;

    teams.forEach(team => {
        const card = document.createElement('div');
        card.className = `team-card lvl-${team.level}`;
        card.innerHTML = `
            <div class="card-top">
                <h3>${escapeHtml(team.name)}</h3>
                <div class="tag-container">
                    <span class="card-tag tag-location">📍 ${escapeHtml(team.location.split(' ')[1] || team.location)}</span>
                    <span class="card-tag tag-experience">⏳ 구력 ${escapeHtml(team.experience)}</span>
                    <span class="card-tag tag-level lvl-${team.level}">${escapeHtml(team.level)}</span>
                </div>
                <div class="card-info">${escapeHtml(team.info)}</div>
            </div>
            <div class="card-footer">
                <span class="card-manner">🔥 매너 ${team.manner}°C</span>
                <div class="card-actions">
                    <button class="btn-card-msg" onclick="openMsgModal('${escapeHtml(team.name)}')">✉ 쪽지</button>
                    <button class="btn-card-match" onclick="applyMatch('${escapeHtml(team.name)}', '${escapeHtml(team.contact)}')">매칭 신청</button>
                </div>
            </div>
        `;
        teamGridContainer.appendChild(card);
    });
}

// [추가 스펙] 마이페이지 대시보드 데이터 바인딩 렌더러
function renderMyPage() {
    const myTeam = getMyTeam();
    const stats = getStats();
    const contacts = getContacts();
    const messages = getMessages();

    // 내 팀 정보 매핑
    if(myTeam) {
        document.getElementById('my-team-name-display').textContent = myTeam.name;
        document.getElementById('my-team-loc-display').textContent = `📍 ${myTeam.location} | ${myTeam.level}`;
    } else {
        document.getElementById('my-team-name-display').textContent = "등록된 팀 없음";
        document.getElementById('my-team-loc-display').textContent = "상단 버튼을 통해 팀을 먼저 등록하세요.";
    }

    // 통계 수치 바인딩
    document.getElementById('stat-attempts').textContent = stats.attempts;
    document.getElementById('stat-success').textContent = stats.success;

    // 연락처 바인딩
    const contactContainer = document.getElementById('contact-list-container');
    contactContainer.innerHTML = '';
    if(contacts.length === 0) {
        contactContainer.innerHTML = `<p class="card-subtext">성사된 매칭 연락 목록이 비어있습니다.</p>`;
    } else {
        contacts.forEach(c => {
            const item = document.createElement('div');
            item.className = 'contact-item';
            item.innerHTML = `
                <div class="contact-info-block">
                    <h4>${escapeHtml(c.name)}</h4>
                    <p>📞 연락처: ${escapeHtml(c.contact)}</p>
                </div>
                <span class="count-badge" style="background:#d1fae5; color:#065f46;">연결완료</span>
            `;
            contactContainer.appendChild(item);
        });
    }

    // 수신 메시지 바인딩
    const msgContainer = document.getElementById('message-list-container');
    msgContainer.innerHTML = '';
    if(messages.length === 0) {
        msgContainer.innerHTML = `<p class="card-subtext">수신된 다이렉트 쪽지가 없습니다.</p>`;
    } else {
        messages.forEach(m => {
            const item = document.createElement('div');
            item.className = 'message-item';
            item.innerHTML = `
                <div class="message-info-block">
                    <h4>발신: ${escapeHtml(m.sender)} <span class="msg-date">(${m.date})</span></h4>
                    <p>${escapeHtml(m.text)}</p>
                </div>
            `;
            msgContainer.appendChild(item);
        });
    }
}

// 매칭 신청 시 카운터 누적 연동 함수
window.applyMatch = function(name, contact) {
    if(!getMyTeam()) {
        alert('우리 팀을 먼저 등록해야 매칭 신청을 진행할 수 있습니다.');
        return;
    }
    const check = confirm(`[${name}] 팀에 교류전 매칭을 요청하시겠습니까?`);
    if(check) {
        // 통계 및 연락처 누적 프로세스
        const stats = getStats();
        stats.attempts += 1;
        stats.success += 1; // 목업 환경이므로 신청 즉시 성사로 트리거링 처리
        localStorage.setItem('v_stats', JSON.stringify(stats));

        const contacts = getContacts();
        if(!contacts.some(c => c.name === name)) {
            contacts.push({ name: name, contact: contact });
            localStorage.setItem('v_contacts', JSON.stringify(contacts));
        }

        alert(`✔ 매칭이 성사되었습니다!\n마이페이지의 '연락처 목록'에서 연락처를 확인해 보세요.`);
    }
}

// 쪽지 모달 활성화 제어 파트
window.openMsgModal = function(targetTeamName) {
    if(!getMyTeam()) {
        alert('우리 팀을 먼저 등록해야 쪽지를 보낼 수 있습니다.');
        return;
    }
    currentMessageTarget = targetTeamName;
    document.getElementById('msg-target-team').textContent = targetTeamName;
    messageModal.classList.add('active');
}

// 메세지 전송 액션 파이프라인
messageSendForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const text = document.getElementById('msg-content').value;
    const myTeam = getMyTeam();

    const messages = getMessages();
    messages.unshift({
        sender: myTeam.name,
        target: currentMessageTarget,
        text: text,
        date: new Date().toLocaleDateString()
    });
    localStorage.setItem('v_messages', JSON.stringify(messages));

    document.getElementById('msg-content').value = "";
    messageModal.classList.remove('active');
    alert(`✉ [${currentMessageTarget}] 팀에게 다이렉트 쪽지가 안전하게 전달되었습니다! (내역은 마이페이지 수신함에서 즉시 모킹 확인 가능)`);
});

// 팀 등록 핸들러
teamRegisterForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const tData = {
        id: Date.now(),
        name: document.getElementById('form-name').value,
        location: document.getElementById('form-location').value,
        experience: document.getElementById('form-experience').value,
        level: document.getElementById('form-level').value,
        info: document.getElementById('form-info').value,
        contact: document.getElementById('form-contact').value,
        manner: 99
    };

    localStorage.setItem('v_myteam', JSON.stringify(tData));
    const teams = getTeams();
    teams.unshift(tData);
    localStorage.setItem('v_teams', JSON.stringify(teams));

    teamRegisterForm.reset();
    teamModal.classList.remove('active');
    renderTeams();
    alert('우리 배구부가 성공적으로 플랫폼에 등록 및 마이페이지 연동이 완료되었습니다.');
});

// 검색 조건 필터 제어기
document.getElementById('btn-apply-filter').addEventListener('click', function() {
    const loc = document.getElementById('filter-location').value;
    const lvl = document.getElementById('filter-level').value;
    const exp = document.getElementById('filter-experience').value;

    const filtered = getTeams().filter(t => {
        return (!loc || t.location === loc) && (!lvl || t.level === lvl) && (!exp || t.experience === exp);
    });
    renderTeams(filtered);
});

document.getElementById('btn-reset-filter').addEventListener('click', function() {
    document.getElementById('filter-location').value = "";
    document.getElementById('filter-level').value = "";
    document.getElementById('filter-experience').value = "";
    renderTeams();
});

// 기본 공통 모달 제어 리스너들
document.getElementById('btn-open-modal').addEventListener('click', () => teamModal.classList.add('active'));
document.getElementById('btn-close-modal').addEventListener('click', () => teamModal.classList.remove('active'));
document.getElementById('btn-cancel-modal').addEventListener('click', () => teamModal.classList.remove('active'));
document.getElementById('btn-close-msg-modal').addEventListener('click', () => messageModal.classList.remove('active'));
document.getElementById('btn-cancel-msg-modal').addEventListener('click', () => messageModal.classList.remove('active'));

function escapeHtml(str) { return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''; }

document.addEventListener('DOMContentLoaded', () => renderTeams());
