/* app.js */

/* 전역 상수 및 설정 */
const MEMBER_LIST = [
  {id:"Gunil", display:"건일 선배"},
  {id:"Jeongsu", display:"정수"},
  {id:"Gaon", display:"지석"},
  {id:"Ode", display:"뜽이"},
  {id:"Junhan", display:"자영"},
  {id:"Jooyeon", display:"쭈쿠나쭈타타"},
];

/* 유틸리티 함수 */
function qs(sel,root=document){return root.querySelector(sel);}
function qsa(sel,root=document){return [...root.querySelectorAll(sel)];}
function getParam(name){
  const p=new URLSearchParams(location.search);
  return p.get(name);
}
function getNickname(){
  return localStorage.getItem("fanNickname") || "";
}
function setNickname(nick){
  localStorage.setItem("fanNickname", nick);
}
function getMemberDisplay(id){
  const m = MEMBER_LIST.find(x=>x.id===id);
  return m ? m.display : id;
}
function profileSrc(id){
  // 이 경로는 member.html에서 멤버의 현재(최신) 프로필 이미지를 로드할 때 사용됩니다.
  // viewer.html의 히스토리는 CSV 파일의 경로를 따릅니다.
  return `images/${id}_profile.jpg`;
}
function backgroundSrc(id){
  // 이 경로는 member.html에서 멤버의 현재(최신) 배경 이미지를 로드할 때 사용됩니다.
  // viewer.html의 히스토리는 CSV 파일의 경로를 따릅니다.
  return `images/${id}_background.jpg`;
}
function chatDataSrc(id){ // 기존 채팅 데이터 경로 함수명 변경
  const username = 'Joo-is-my-life';
  const repoName = 'test';
  const branch = 'main';
  return `https://raw.githubusercontent.com/${username}/${repoName}/${branch}/data/${id}.csv`;
}

// ⭐ 히스토리 데이터 경로 함수 추가 ⭐
function historyDataSrc(memberId, type){
  const username = 'Joo-is-my-life';
  const repoName = 'test';
  const branch = 'main';
  // 타입에 따라 profile 또는 background 폴더 지정
  return `https://raw.githubusercontent.com/${username}/${repoName}/${branch}/data/${type}/${memberId}.csv`;
}

function formatDateK(dateStr){
  const d = new Date(dateStr);
  if(!isNaN(d.getTime())){
    const y=d.getFullYear();
    const m=d.getMonth()+1;
    const day=d.getDate();
    const weekday=["일","월","화","수","목","금","토"][d.getDay()];
    return `${y}년 ${m}월 ${day}일 ${weekday}요일`;
  }
  return dateStr;
}

/* 아카이브 페이지 초기화 */
function initArchive(){
  const listEl = qs("#archiveList");
  if(!listEl) return;
  MEMBER_LIST.forEach(m=>{
    const row=document.createElement("a");
    row.className="archive-row";
    row.href=`member.html?m=${m.id}`;
    row.innerHTML=`
      <span class="archive-row-avatar-wrap">
        <img class="archive-row-avatar" src="${profileSrc(m.id)}" alt="${m.display}"
             onerror="this.src='images/default_profile.jpg'">
      </span>
      <span class="archive-row-name">${m.display}</span>
      <span class="archive-row-status"> </span>
    `;
    listEl.appendChild(row);
  });
}

/* 멤버 프로필 페이지 초기화 */
function initMember(){
  const id=getParam("m");
  if(!id) {
    console.warn("Member ID not found in URL for member.html");
    return;
  }
  const disp=getMemberDisplay(id);
  const bg=qs("#memberBg");
  const prof=qs("#memberProfile");
  const nameEl=qs("#memberDisplayName");
  const btn=qs("#viewChatBtn");

  if(bg) {
    bg.src=backgroundSrc(id);
    // ⭐ 배경 이미지 클릭 시 viewer.html로 이동 ⭐
    bg.addEventListener("click", () => {
      location.href = `viewer.html?m=${id}&type=background`;
    });
  }
  if(prof){
    prof.src=profileSrc(id);
    prof.onerror=()=>{prof.src="images/default_profile.jpg";}
    // ⭐ 프로필 이미지 클릭 시 viewer.html로 이동 ⭐
    prof.addEventListener("click", () => {
      location.href = `viewer.html?m=${id}&type=profile`;
    });
  }
  if(nameEl) nameEl.textContent=disp;
  if(btn){
    btn.addEventListener("click",()=>{ location.href=`chat.html?m=${id}`; });
  }
}

/* 채팅 페이지 초기화 */
let currentMemberId=null;
function initChat(){
  const id=getParam("m");
  if(!id) {
    console.warn("Member ID not found in URL for chat.html");
    return;
  }
  currentMemberId=id;
  const disp=getMemberDisplay(id);
  const titleEl=qs("#chatMemberName");
  if(titleEl) titleEl.textContent=disp;

  openNickModal(); // 닉네임 유무와 상관없이 항상 모달을 띄움
}

// CSV 텍스트를 파싱하여 JSON 객체 배열로 변환
function parseCsv(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = [];
    let inQuote = false;
    let currentVal = '';
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' && (j === 0 || line[j-1] === ',' || inQuote)) {
        if (inQuote && j + 1 < line.length && line[j+1] === '"') {
          currentVal += '"';
          j++;
        } else {
          inQuote = !inQuote;
        }
      } else if (char === ',' && !inQuote) {
        values.push(currentVal.trim());
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] !== undefined ? values[index].trim() : '';
    });
    result.push(row);
  }
  return result;
}


// ⭐ 미디어 모달 관련 DOM 요소 참조 변수 추가 ⭐ (viewer.html에서도 사용되도록 전역 정의)
const mediaModal = qs("#mediaModal");
const closeMediaModalBtn = qs("#closeMediaModal");
const modalImage = qs("#modalImage");
const modalVideo = qs("#modalVideo");
const downloadMediaBtn = qs("#downloadMediaBtn");
// ⭐ 히스토리 내비게이션 버튼 추가 ⭐
const prevMediaBtn = qs("#prevMediaBtn");
const nextMediaBtn = qs("#nextMediaBtn");

let currentMediaHistory = []; // 현재 팝업에 표시될 미디어 히스토리 배열
let currentMediaIndex = 0;    // 현재 표시 중인 미디어의 인덱스

// 파일 경로에서 미디어 타입 (image/video) 추론 함수 (renderChat 전에 필요)
function getMediaType(path) {
    if (/\.(mp4|mov|webm|ogg)$/i.test(path)) {
        return 'video';
    } else if (/\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(path)) {
        return 'image';
    }
    return 'unknown';
}


// ⭐ 채팅 UI 렌더링 ⭐ (loadChatData 함수보다 먼저 정의되도록 위치 변경)
function renderChat(box, data, memberId){
  box.innerHTML="";
  const fanNick=getNickname() || "빌런즈";
  let lastDate=null;
  data.forEach(msg=>{
    if(msg.date && msg.date!==lastDate){
      const sep=document.createElement("div");
      sep.className="chat-date-sep";
      sep.textContent=formatDateK(msg.date);
      box.appendChild(sep);
      lastDate=msg.date;
    }
    
    const msgWrap = document.createElement("div");
    msgWrap.className = "chat-msg-wrap";

    const msgContent = document.createElement("div");
    msgContent.className = `chat-msg artist`;

    let mediaUrl = null;
    let mediaType = null;

    if (msg.type === 'image' && msg.media) {
      const img = document.createElement("img");
      img.src = msg.media;
      img.alt = "채팅 이미지";
      img.className = "chat-media-image";
      msgContent.appendChild(img);
      mediaUrl = msg.media;
      mediaType = 'image';
    } else if (msg.type === 'video' && msg.media) {
      const video = document.createElement("video");
      video.src = msg.media;
      video.controls = true;
      video.className = "chat-media-video";
      msgContent.appendChild(video);
      mediaUrl = msg.media;
      mediaType = 'video';
    } else if (msg.text && msg.text.trim() !== '') {
      const msgText = document.createTextNode(msg.text.replace(/\(name\)/g, fanNick));
      msgContent.appendChild(msgText);
    } else {
      console.warn("Skipping message with no content:", msg);
      return;
    }

    if (mediaUrl) {
        msgContent.style.cursor = 'pointer';
        // 채팅방의 미디어 팝업은 히스토리 기능이 없으므로, 현재 미디어만 단독으로 넘김
        msgContent.addEventListener('click', () => {
            openMediaModal(mediaUrl, mediaType, [{ path: mediaUrl, type: mediaType, type_orig: 'chat' }], 0);
        });
    }

    msgWrap.appendChild(msgContent);
    
    if (msg.time) {
      const meta = document.createElement("div");
      meta.className = "chat-meta";
      meta.textContent = msg.time;
      msgWrap.appendChild(meta);
    }
    
    box.appendChild(msgWrap);
  });
  box.scrollTop = box.scrollHeight;
}


// 채팅 데이터 비동기 로드
async function loadChatData(id){
  const box=qs("#chatScroll");
  if(!box) return;
  box.innerHTML="<div class='chat-date-sep'>채팅 데이터 불러오는 중...</div>";
  try{
    const res=await fetch(chatDataSrc(id)); // ⭐ chatDataSrc 함수 사용 ⭐
    if(!res.ok) {
      let errorMessage = `데이터를 불러올 수 없어요. (오류 코드: ${res.status})`;
      if (res.status === 404) {
        errorMessage = `데이터 파일이 없거나 경로가 잘못되었습니다. (${id}.csv 확인)`;
      } else if (res.status >= 500) {
        errorMessage = `서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.`;
      }
      throw new Error(errorMessage);
    }
    const csvText = await res.text();
    const data = parseCsv(csvText);
    if (data.length === 0) {
      box.innerHTML = "<div class='chat-date-sep'>아직 채팅 데이터가 없어요.</div>";
      return;
    }
    renderChat(box, data, id);
  }catch(err){
    box.innerHTML=`<div class='chat-date-sep'>${err.message || "알 수 없는 오류가 발생했어요."}</div>`;
    console.error("Failed to load chat data:", err);
  }
}

// ⭐ 미디어 팝업 열기 함수 (채팅방, 뷰어 페이지에서 모두 사용) ⭐
function openMediaModal(mediaUrl, mediaType, historyData = [], initialIndex = 0) {
    if (!mediaModal || !modalImage || !modalVideo || !downloadMediaBtn) {
        console.error("미디어 모달 관련 DOM 요소를 찾을 수 없습니다.");
        return;
    }

    modalImage.style.display = 'none'; // 기본적으로 이미지/동영상 모두 숨김
    modalVideo.style.display = 'none';
    modalVideo.pause(); // 혹시 재생 중인 비디오가 있으면 일시 정지

    currentMediaHistory = historyData; // 히스토리 데이터 저장
    currentMediaIndex = initialIndex; // 초기 인덱스 설정

    // 현재 선택된 미디어를 팝업에 표시
    updateMediaModalContent();

    mediaModal.classList.remove('hidden'); // 팝업 표시
    document.body.style.overflow = 'hidden'; // 스크롤 방지

    // 히스토리 버튼 활성화/비활성화
    updateMediaNavButtons();
}

// ⭐ 팝업 내용 업데이트 함수 ⭐
function updateMediaModalContent() {
    const mediaItem = currentMediaHistory[currentMediaIndex];
    if (!mediaItem) {
        console.error("Invalid media history item or index:", currentMediaIndex, currentMediaHistory);
        return;
    }

    modalImage.style.display = 'none';
    modalVideo.style.display = 'none';
    modalVideo.pause();
    modalVideo.currentTime = 0;

    // mediaItem.type_orig는 viewer.html에서 넘어온 경우 'profile'/'background'
    // mediaItem.type은 getMediaType에서 추론한 'image'/'video'
    // 채팅방에서 넘어온 경우에는 type_orig가 없고, type이 바로 'image'/'video'
    if (mediaItem.type === 'image' || mediaItem.type_orig === 'image') {
        modalImage.src = mediaItem.path;
        modalImage.style.display = 'block';
    } else if (mediaItem.type === 'video' || mediaItem.type_orig === 'video') {
        modalVideo.src = mediaItem.path;
        modalVideo.style.display = 'block';
        modalVideo.load();
    } else {
        // Fallback for unknown types or missing data
        console.warn("Unknown media type or missing path:", mediaItem);
    }


    downloadMediaBtn.href = mediaItem.path;
    const fileName = mediaItem.path.split('/').pop().split('?')[0];
    downloadMediaBtn.download = fileName;
}

// ⭐ 미디어 팝업 내비게이션 버튼 업데이트 함수 ⭐
function updateMediaNavButtons() {
    // 배열은 [최신, ..., 오래된] 순서입니다.
    // 좌측 화살표 (이전, 즉 더 최신): 현재 인덱스가 0(가장 최신)이 아닐 때 활성화
    if (prevMediaBtn) {
        prevMediaBtn.disabled = currentMediaIndex === 0;
    }
    // 우측 화살표 (다음, 즉 더 과거): 현재 인덱스가 배열의 마지막(가장 오래된)이 아닐 때 활성화
    if (nextMediaBtn) {
        nextMediaBtn.disabled = currentMediaIndex === currentMediaHistory.length - 1;
    }
}

// ⭐ 다음 미디어로 이동 (우측 화살표 클릭 시: 과거 사진) ⭐
function showNextMedia() {
    // 인덱스를 증가시켜 배열의 뒤쪽으로 이동 (즉, 더 오래된 사진)
    if (currentMediaIndex < currentMediaHistory.length - 1) {
        currentMediaIndex++;
        updateMediaModalContent();
        updateMediaNavButtons();
    }
}

// ⭐ 이전 미디어로 이동 (좌측 화살표 클릭 시: 최근 사진) ⭐
function showPrevMedia() {
    // 인덱스를 감소시켜 배열의 앞쪽으로 이동 (즉, 더 최신의 사진)
    if (currentMediaIndex > 0) {
        currentMediaIndex--;
        updateMediaModalContent();
        updateMediaNavButtons();
    }
}


// ⭐ 미디어 팝업 닫기 함수 ⭐
function closeMediaModal() {
    if (mediaModal) {
        mediaModal.classList.add('hidden'); // 팝업 숨김
        modalImage.src = ''; // src 초기화
        modalVideo.src = '';
        modalVideo.pause(); // 비디오 정지
        modalVideo.currentTime = 0; // 비디오 재생 시간 초기화
        document.body.style.overflow = ''; // 스크롤 허용
        currentMediaHistory = []; // 히스토리 초기화
        currentMediaIndex = 0; // 인덱스 초기화
    }
}

/* 닉네임 설정 모달 관련 함수 */
function openNickModal(){
  const m=qs("#nickModal");
  if(m) m.classList.remove("hidden");
  const inp=qs("#nickInput");
  if(inp) inp.focus();
}
function closeNickModal(){
  const m=qs("#nickModal");
  if(m) m.classList.add("hidden");
}
// 닉네임 저장 시 현재 채팅 데이터 로드
function saveNickname(){
  const inp=qs("#nickInput");
  const nick=(inp?.value||"").trim();
  if(nick){
    setNickname(nick);
    closeNickModal();
    if(currentMemberId){
      loadChatData(currentMemberId);
    }
  } else {
    alert("닉네임을 입력해주세요!");
  }
}


// ⭐ viewer.html 페이지 초기화 ⭐
async function initViewer() {
    const id = getParam("m");
    const type = getParam("type"); // 'profile' 또는 'background'
    if (!id || !type) {
        console.warn("Member ID or Type not found in URL for viewer.html");
        return;
    }

    const disp = getMemberDisplay(id);
    const viewerBg = qs("#viewerBg");
    const viewerProf = qs("#viewerProfile");
    const viewerNameEl = qs("#viewerDisplayName");

    if (viewerNameEl) viewerNameEl.textContent = disp;

    // viewer.html에 표시될 실제 이미지 엘리먼트
    let currentViewerMediaElement;
    if (type === 'profile' && viewerProf) {
        currentViewerMediaElement = viewerProf;
    } else if (type === 'background' && viewerBg) {
        currentViewerMediaElement = viewerBg;
    }

    // 히스토리 데이터 로드 및 클릭 이벤트 연결
    try {
        const res = await fetch(historyDataSrc(id, type)); // 해당 멤버의 특정 타입 히스토리 CSV 로드
        if (!res.ok) {
            console.error(`Failed to load history data for ${id}, type ${type}. Status: ${res.status}`);
            // CSV 로드 실패 시, 기본 이미지라도 로드 시도
            if (currentViewerMediaElement) {
                currentViewerMediaElement.src = (type === 'profile') ? profileSrc(id) : backgroundSrc(id);
                if (type === 'profile') {
                    currentViewerMediaElement.onerror = () => { currentViewerMediaElement.src = "images/default_profile.jpg"; };
                }
            }
            return;
        }
        const csvText = await res.text();
        const rawHistory = parseCsv(csvText); // CSV 파싱

        // ⭐ 핵심: 날짜를 기준으로 내림차순 정렬 (가장 최근 것부터 오래된 것 순으로) ⭐
        const sortedHistory = rawHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 각 항목에 'type' 정보 추가 (팝업에서 사용하기 위함)
        const historyWithTypes = sortedHistory.map(item => ({ ...item, type_orig: type, type: getMediaType(item.path) }));
        
        if (currentViewerMediaElement && historyWithTypes.length > 0) {
            // ⭐ viewer.html의 초기 이미지를 CSV에서 불러온 가장 최신 이미지 (배열의 0번째)로 설정 ⭐
            currentViewerMediaElement.src = historyWithTypes[0].path;

            currentViewerMediaElement.addEventListener('click', () => {
                // ⭐ initialIndex를 0으로 설정하여 가장 최근 (배열의 첫 번째) 사진부터 시작 ⭐
                openMediaModal(historyWithTypes[0]?.path, historyWithTypes[0]?.type, historyWithTypes, 0);
            });
        } else if (currentViewerMediaElement) {
            // CSV 데이터는 없지만 이미지를 표시할 엘리먼트가 있는 경우: 기존의 '최신' 이미지 로드
            currentViewerMediaElement.src = (type === 'profile') ? profileSrc(id) : backgroundSrc(id);
            if (type === 'profile') {
                currentViewerMediaElement.onerror = () => { currentViewerMediaElement.src = "images/default_profile.jpg"; };
            }
        }

    } catch (error) {
        console.error("Error loading profile/background history:", error);
        // 오류 발생 시에도 기본 이미지 로드 시도
        if (currentViewerMediaElement) {
            currentViewerMediaElement.src = (type === 'profile') ? profileSrc(id) : backgroundSrc(id);
            if (type === 'profile') {
                currentViewerMediaElement.onerror = () => { currentViewerMediaElement.src = "images/default_profile.jpg"; };
            }
        }
    }
}


/* 페이지 로드 시 초기화 함수 실행 */
document.addEventListener("DOMContentLoaded",()=>{
  const path=location.pathname;
  if(path.endsWith("index.html") || path.endsWith("/")){
    initArchive();
  }else if(path.endsWith("member.html")){
    initMember();
  }else if(path.endsWith("chat.html")){
    initChat();
  }else if(path.endsWith("viewer.html")){ // ⭐ 새로운 viewer.html 초기화 ⭐
    initViewer();
  }

  // ⭐ 미디어 팝업 닫기 이벤트 리스너 추가 ⭐
  if (closeMediaModalBtn) {
    closeMediaModalBtn.addEventListener('click', closeMediaModal);
  }
  // 팝업 배경 클릭 시 닫기 (미디어 콘텐츠 클릭은 제외)
  if (mediaModal) {
    mediaModal.addEventListener('click', (e) => {
        if (e.target === mediaModal) { // 정확히 배경을 클릭했을 때만 닫음
            closeMediaModal();
        }
    });
  }
  // ⭐ 미디어 팝업 내비게이션 버튼 이벤트 리스너 추가 ⭐
  if (prevMediaBtn) {
    prevMediaBtn.addEventListener('click', showPrevMedia);
  }
  if (nextMediaBtn) {
    nextMediaBtn.addEventListener('click', showNextMedia);
  }
});
