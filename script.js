// Selectors for buttons and elements
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');
const btnUpload = document.getElementById('btn-upload');
const btnProfile = document.getElementById('btn-profile');
const btnNotif = document.getElementById('btn-notif');
const btnLogout = document.getElementById('btn-logout');

//modal
const loginModal = document.getElementById('login-modal');
const closeLoginModal = document.getElementById('login-close')
const registerModal = document.getElementById('register-modal');
const closeRegisterModal = document.getElementById('register-close')
const uploadModal = document.getElementById('upload-modal');
const profileModal = document.getElementById('profile-modal');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const uploadForm = document.getElementById('upload-form');

const profileName = document.getElementById('profile-name');
const profilePic = document.getElementById('profile-pic');
const profilePicInput = document.getElementById('profile-pic-input');

const profileLikes = document.getElementById('profile-likes');
const profileFavorites = document.getElementById('profile-favorites');
const profileReposts = document.getElementById('profile-reposts');
const profileViews = document.getElementById('profile-views');
const profileFollowers = document.getElementById('profile-followers');

const profileClose = document.getElementById('profile-close');
const uploadClose = document.getElementById('upload-close');

const feed = document.getElementById('feed');

let currentUser = null;
let videos = [];

// --- STORAGE FUNCTIONS ---
function loadUsers() {
  const users = localStorage.getItem('clipspark_users');
  return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
  localStorage.setItem('clipspark_users', JSON.stringify(users));
}

function loadVideos() {
  const vids = localStorage.getItem('clipspark_videos');
  return vids ? JSON.parse(vids) : [];
}

function saveVideos(videos) {
  localStorage.setItem('clipspark_videos', JSON.stringify(videos));
}

function loadNotifications() {
  const notifs = localStorage.getItem('clipspark_notifications');
  return notifs ? JSON.parse(notifs) : [];
}

function saveNotifications(notifs) {
  localStorage.setItem('clipspark_notifications', JSON.stringify(notifs));
}

// --- NOTIFICATIONS ---
function addNotification(text) {
  const notifs = loadNotifications();
  notifs.unshift({ text, read: false, date: new Date().toISOString() });
  saveNotifications(notifs);
  updateNotifUI();
}

function markAllRead() {
  const notifs = loadNotifications();
  notifs.forEach(n => (n.read = true));
  saveNotifications(notifs);
  updateNotifUI();
}

function updateNotifUI() {
  const notifs = loadNotifications();
  const unreadCount = notifs.filter(n => !n.read).length;
  btnNotif.textContent = `🔔${unreadCount > 0 ? ' (' + unreadCount + ')' : ''}`;
}

// Format numbers for views display (e.g., 10k, 1.2m)
function formatCount(num) {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'm';
  if (num >= 10_000) return Math.floor(num / 1_000) + 'k';
  return num.toString();
}

// Sanitize HTML minimal
function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

// Parse hashtags to bold
function parseDescription(text) {
  return text.replace(/(#\w+)/g, '<b>$1</b>');
}

// Check handle uniqueness
function isHandleUnique(handle) {
  const users = loadUsers();
  return !users.some(u => u.handle.toLowerCase() === handle.toLowerCase());
}

// Load current user from localStorage
function loadCurrentUser() {
  const stored = localStorage.getItem('clipspark_currentUser');
  currentUser = stored ? JSON.parse(stored) : null;
}

// Save current user to localStorage
function saveCurrentUser() {
  if (currentUser) {
    localStorage.setItem('clipspark_currentUser', JSON.stringify(currentUser));
  } else {
    localStorage.removeItem('clipspark_currentUser');
  }
}

// Shuffle array helper
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- UI UPDATE FUNCTIONS ---

// Create video box element
function createVideoBox(video) {
  const box = document.createElement('div');
  box.className = 'video-box';

  const vid = document.createElement('video');
  vid.src = video.videoURL;
  vid.autoplay = true;
  vid.muted = true;
  vid.loop = true;
  vid.controls = false;
  vid.title = video.title;
  vid.style.cursor = 'pointer';

  vid.addEventListener('click', () => {
    showProfile(video.uploaderHandle);
  });

  box.appendChild(vid);

  const controls = document.createElement('div');
  controls.className = 'controls';

  const uploaderPic = document.createElement('img');
  uploaderPic.className = 'profile-pic';
  uploaderPic.src = video.uploaderProfilePic || 'https://via.placeholder.com/46?text=User';
  uploaderPic.title = video.uploaderDisplayName;
  uploaderPic.style.cursor = 'pointer';
  uploaderPic.addEventListener('click', () => {
    showProfile(video.uploaderHandle);
  });
  controls.appendChild(uploaderPic);

  const titleSpan = document.createElement('span');
  titleSpan.textContent = video.title;
  titleSpan.style.fontWeight = '700';
  titleSpan.style.marginLeft = '10px';
  controls.appendChild(titleSpan);

  const viewsSpan = document.createElement('span');
  viewsSpan.className = 'view-count';
  viewsSpan.innerHTML = `<ion-icon name="play-circle-outline"></ion-icon> ${formatCount(video.views || 0)}`;
  controls.appendChild(viewsSpan);

  const likeBtn = document.createElement('ion-icon');
  likeBtn.name = 'heart-outline';
  likeBtn.title = 'Like';
  likeBtn.style.marginLeft = 'auto';
  likeBtn.style.color = video.likes?.includes(currentUser?.handle) ? '#bb86fc' : '#fff';
  likeBtn.style.cursor = 'pointer';
  likeBtn.addEventListener('click', () => {
    if (!currentUser) return alert('Login to like videos');
    toggleLike(video.id);
  });
  controls.appendChild(likeBtn);

  const favBtn = document.createElement('ion-icon');
  favBtn.name = 'star-outline';
  favBtn.title = 'Favorite';
  favBtn.style.cursor = 'pointer';
  favBtn.style.marginLeft = '10px';
  favBtn.style.color = video.favorites?.includes(currentUser?.handle) ? '#bb86fc' : '#fff';
  favBtn.addEventListener('click', () => {
    if (!currentUser) return alert('Login to favorite videos');
    toggleFavorite(video.id);
  });
  controls.appendChild(favBtn);

  const repostBtn = document.createElement('ion-icon');
  repostBtn.name = 'repeat-outline';
  repostBtn.title = 'Repost';
  repostBtn.style.cursor = 'pointer';
  repostBtn.style.marginLeft = '10px';
  repostBtn.style.color = video.reposts?.includes(currentUser?.handle) ? '#bb86fc' : '#fff';
  repostBtn.addEventListener('click', () => {
    if (!currentUser) return alert('Login to repost videos');
    toggleRepost(video.id);
  });
  controls.appendChild(repostBtn);

  box.appendChild(controls);

  const desc = document.createElement('div');
  desc.className = 'video-info';
  desc.innerHTML = parseDescription(sanitizeHTML(video.description || ''));
  box.appendChild(desc);

  return box;
}

function renderFeed() {
  feed.innerHTML = '';
  if (videos.length === 0) {
    feed.textContent = 'No videos uploaded yet.';
    return;
  }
  const shuffledVideos = shuffleArray(videos);
  shuffledVideos.forEach(video => {
    feed.appendChild(createVideoBox(video));
  });
}

// Toggle like for a video
function toggleLike(id) {
  const video = videos.find(v => v.id === id);
  if (!video) return;
  if (!video.likes) video.likes = [];
  const index = video.likes.indexOf(currentUser.handle);
  if (index === -1) {
    video.likes.push(currentUser.handle);
    addNotification(`${currentUser.displayName} liked your video "${video.title}"`);
  } else {
    video.likes.splice(index, 1);
  }
  saveVideos(videos);
  renderFeed();
  updateNotifUI();
}

// Toggle favorite for a video
function toggleFavorite(id) {
  const video = videos.find(v => v.id === id);
  if (!video) return;
  if (!video.favorites) video.favorites = [];
  const index = video.favorites.indexOf(currentUser.handle);
  if (index === -1) {
    video.favorites.push(currentUser.handle);
    addNotification(`${currentUser.displayName} favorited your video "${video.title}"`);
  } else {
    video.favorites.splice(index, 1);
  }
  saveVideos(videos);
  renderFeed();
  updateNotifUI();
}

// Toggle repost for a video
function toggleRepost(id) {
  const video = videos.find(v => v.id === id);
  if (!video) return;
  if (!video.reposts) video.reposts = [];
  const index = video.reposts.indexOf(currentUser.handle);
  if (index === -1) {
    video.reposts.push(currentUser.handle);
    addNotification(`${currentUser.displayName} reposted your video "${video.title}"`);
  } else {
    video.reposts.splice(index, 1);
  }
  saveVideos(videos);
  renderFeed();
  updateNotifUI();
}

// Show profile modal for a user handle (or current user if none)
function showProfile(handle) {
  if (!handle && !currentUser) return alert('Login to view profiles');
  const userHandle = handle || currentUser.handle;
  const users = loadUsers();
  const user = users.find(u => u.handle === userHandle);
  if (!user) return alert('User not found');

  currentUser = user;
  saveCurrentUser();

  profileName.textContent = user.displayName + ` (@${user.handle})`;
  profilePic.src = user.profilePic || 'https://via.placeholder.com/120?text=User';

  const userVideos = videos.filter(v => v.uploaderHandle === user.handle);
  const repostedVideos = videos.filter(v => v.reposts?.includes(user.handle));
  const likedVideos = videos.filter(v => v.likes?.includes(user.handle));
  const favoritedVideos = videos.filter(v => v.favorites?.includes(user.handle));
  const followers = getFollowersForUser(user.handle);

  document.querySelectorAll('.tab-content').forEach(tc => tc.innerHTML = '');

  const tabVideos = document.getElementById('tab-videos');
  userVideos.forEach(v => {
    const box = createVideoBox(v);
    box.style.marginBottom = '1rem';
    tabVideos.appendChild(box);
  });

  const tabReposts = document.getElementById('tab-reposts');
  repostedVideos.forEach(v => {
    const box = createVideoBox(v);
    box.style.marginBottom = '1rem';
    tabReposts.appendChild(box);
  });

  const tabLikes = document.getElementById('tab-likes');
  likedVideos.forEach(v => {
    const box = createVideoBox(v);
    box.style.marginBottom = '1rem';
    tabLikes.appendChild(box);
  });

  const tabFavorites = document.getElementById('tab-favorites');
  favoritedVideos.forEach(v => {
    const box = createVideoBox(v);
    box.style.marginBottom = '1rem';
    tabFavorites.appendChild(box);
  });

  const tabFollowers = document.getElementById('tab-followers');
  followers.forEach(f => {
    const div = document.createElement('div');
    div.classList.add('follower-item');
    const img = document.createElement('img');
    img.src = f.profilePic || 'https://via.placeholder.com/40?text=User';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = f.displayName + ` (@${f.handle})`;
    div.appendChild(img);
    div.appendChild(nameSpan);
    tabFollowers.appendChild(div);
  });

  updateProfileStats();

  switchTab('videos');
  openModal(profileModal);
}

// Update profile stats (likes, favorites, reposts, views, followers)
function updateProfileStats() {
  if (!currentUser) return;
  const userVideos = videos.filter(v => v.uploaderHandle === currentUser.handle);
  const likesCount = userVideos.reduce((acc, v) => acc + (v.likes?.length || 0), 0);
  const favoritesCount = userVideos.reduce((acc, v) => acc + (v.favorites?.length || 0), 0);
  const repostsCount = userVideos.reduce((acc, v) => acc + (v.reposts?.length || 0), 0);
  const viewsCount = userVideos.reduce((acc, v) => acc + (v.views || 0), 0);

  profileLikes.textContent = `Likes: ${likesCount}`;
  profileFavorites.textContent = `Favorites: ${favoritesCount}`;
  profileReposts.textContent = `Reposts: ${repostsCount}`;
  profileViews.textContent = `Views: ${formatCount(viewsCount)}`;
  profileFollowers.textContent = `Followers: ${getFollowersForUser(currentUser.handle).length}`;
}

// Dummy followers generator, replace with your backend or logic
function getFollowersForUser(handle) {
  const users = loadUsers();
  return users.filter(u => u.handle !== handle).slice(0, 3);
}

// Switch tabs in profile modal by tab name
function switchTab(tabName) {
  document.querySelectorAll('.profile-tabs .tab-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.querySelector(`.profile-tabs .tab-btn[data-tab="${tabName}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
  const activeContent = document.getElementById(`tab-${tabName}`);
  if (activeContent) activeContent.classList.add('active');
}

// Attach event listeners for profile tab buttons
document.querySelectorAll('.profile-tabs .tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.tab);
  });
});

// --- EVENTS ---

btnLogin.addEventListener('click', () => openModal(loginModal));
closeLoginModal.addEventListener('click' , ()=> closeModal(loginModal))
btnRegister.addEventListener('click', () => openModal(registerModal));
closeRegisterModal.addEventListener('click',()=>closeModal(registerModal))
btnUpload.addEventListener('click', () => openModal(uploadModal));
btnProfile.addEventListener('click', () => showProfile());
btnNotif.addEventListener('click', () => {
  const notifs = loadNotifications();
  if (notifs.length === 0) return alert('No notifications yet');
  let msg = 'Notifications:\n\n';
  notifs.forEach(n => {
    msg += (n.read ? '' : '* ') + n.text + '\n';
  });
  alert(msg);
  markAllRead();
});

profileClose.addEventListener('click', () => closeModal(profileModal));
uploadClose.addEventListener('click', () => closeModal(uploadModal));

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const handle = loginForm.handle.value.trim();
  const password = loginForm.password.value;
  const users = loadUsers();
  const user = users.find(u => u.handle === handle && u.password === password);
  if (!user) {
    document.getElementById('login-error').textContent = 'Invalid handle or password.';
    return;
  }
  currentUser = user;
  saveCurrentUser();
  updateUIForLogin();
  closeModal(loginModal);
  renderFeed();
  updateNotifUI();
});

registerForm.addEventListener('submit', e => {
  e.preventDefault();
  const handle = registerForm.handle.value.trim();
  const displayName = registerForm.displayName.value.trim();
  const password = registerForm.password.value;
  if (!handle || !displayName || !password) {
    document.getElementById('register-error').textContent = 'Fill all fields.';
    return;
  }
  if (!isHandleUnique(handle)) {
    document.getElementById('register-error').textContent = 'Handle already taken.';
    return;
  }
  const users = loadUsers();
  users.push({ handle, displayName, password, profilePic: '', videos: [] });
  saveUsers(users);
  alert('Registered successfully. Please login.');
  closeModal(registerModal);
});

uploadForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!currentUser) return alert('Login to upload');

  const title = uploadForm.title.value.trim();
  const description = uploadForm.description.value.trim();
  const file = uploadForm.video.files[0];
  if (!file) {
    document.getElementById('upload-error').textContent = 'Select a video file.';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    const videoURL = event.target.result;
    const newVideo = {
      id: Date.now(),
      uploaderHandle: currentUser.handle,
      uploaderDisplayName: currentUser.displayName,
      uploaderProfilePic: currentUser.profilePic,
      title,
      description,
      videoURL,
      likes: [],
      favorites: [],
      reposts: [],
      views: 0
    };
    videos.unshift(newVideo);
    saveVideos(videos);
    document.getElementById('upload-success').textContent = 'Upload successful!';
    renderFeed();
    closeModal(uploadModal);
  };
  reader.readAsDataURL(file);
});

profilePic.addEventListener('click', () => profilePicInput.click());
document.getElementById('btn-change-pic').addEventListener('click', () => profilePicInput.click());

profilePicInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    if (!currentUser) return;
    currentUser.profilePic = event.target.result;
    saveCurrentUser();

    const users = loadUsers();
    const idx = users.findIndex(u => u.handle === currentUser.handle);
    if (idx !== -1) {
      users[idx].profilePic = currentUser.profilePic;
      saveUsers(users);
    }

    profilePic.src = currentUser.profilePic;
    renderFeed();
  };
  reader.readAsDataURL(file);
});

btnLogout.addEventListener('click', () => {
  currentUser = null;
  saveCurrentUser();
  updateUIForLogin();
  renderFeed();
});

function updateUIForLogin() {
  if (currentUser) {
    btnLogin.style.display = 'none';
    btnRegister.style.display = 'none';
    btnUpload.style.display = 'inline-block';
    btnProfile.style.display = 'inline-block';
    btnNotif.style.display = 'inline-block';
    btnLogout.style.display = 'inline-block';
  } else {
    btnLogin.style.display = 'inline-block';
    btnRegister.style.display = 'inline-block';
    btnUpload.style.display = 'none';
    btnProfile.style.display = 'none';
    btnNotif.style.display = 'none';
    btnLogout.style.display = 'none';
  }
  updateNotifUI();
}

// Modal open/close
function openModal(modal) {
  modal.style.display = 'flex';
}
function closeModal(modal) {
  modal.style.display = 'none';
}

// Initialization
function init() {
  loadCurrentUser();
  videos = loadVideos();
  updateUIForLogin();
  renderFeed();
  updateNotifUI();
}
init();
