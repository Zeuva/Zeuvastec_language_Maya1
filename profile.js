(function () {
  const storageKey = 'zeuvastec-student-name';
  const nameModal = document.getElementById('name-modal');
  const nameInput = document.getElementById('student-name-input');
  const nameForm = document.getElementById('name-form');
  const nameText = document.getElementById('student-name');
  const profileName = document.getElementById('profile-name');
  const initials = document.getElementById('profile-initials');

  function applyName(value) {
    const name = value.trim() || 'amigo';
    nameText.textContent = name;
    profileName.textContent = name;
    initials.textContent = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }
  function openProfile() {
    nameInput.value = localStorage.getItem(storageKey) || '';
    nameModal.classList.remove('hidden');
    window.setTimeout(() => nameInput.focus(), 50);
  }
  const savedName = localStorage.getItem(storageKey);
  if (savedName) applyName(savedName); else window.setTimeout(openProfile, 500);
  document.getElementById('edit-profile').addEventListener('click', openProfile);
  nameForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    localStorage.setItem(storageKey, name);
    applyName(name);
    nameModal.classList.add('hidden');
  });
}());



// Profile modal fix - garante funcionamento e opacidade
(function(){
  const nameModal = document.getElementById('name-modal');
  const nameForm = document.getElementById('name-form');
  const nameInput = document.getElementById('student-name-input');
  const editBtn = document.getElementById('edit-profile');
  const sKey = 'zeuvastec-student-name';

  function applyName(v){
    const name = (v||'amigo').trim() || 'amigo';
    const el1 = document.getElementById('student-name');
    const el2 = document.getElementById('profile-name');
    const el3 = document.getElementById('profile-initials');
    if(el1) el1.textContent = name;
    if(el2) el2.textContent = name;
    if(el3) el3.textContent = name.split(/\s+/).slice(0,2).map(p=>p[0]).join('').toUpperCase();
  }

  function openModal(){
    if(!nameModal) return;
    nameModal.classList.remove('hidden');
    nameModal.style.display = 'grid';
    nameModal.style.opacity = '1';
    nameModal.style.pointerEvents = 'auto';
    if(nameInput){
      nameInput.value = localStorage.getItem(sKey) || '';
      setTimeout(()=> nameInput.focus(), 100);
    }
  }

  function closeModal(){
    if(!nameModal) return;
    nameModal.classList.add('hidden');
    nameModal.style.display = 'none';
  }

  const saved = localStorage.getItem(sKey);
  if(saved) applyName(saved);

  if(editBtn){
    editBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();
      openModal();
    });
  }

  if(nameForm){
    nameForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const n = nameInput ? nameInput.value.trim() : '';
      if(!n) return;
      localStorage.setItem(sKey, n);
      applyName(n);
      closeModal();
    });
  }

  if(nameModal){
    nameModal.addEventListener('click', (e)=>{
      if(e.target === nameModal) closeModal();
    });
  }

  // Tecla ESC fecha
  document.addEventListener('keydown', (e)=>{
    if(e.key==='Escape' && nameModal && !nameModal.classList.contains('hidden')){
      closeModal();
    }
  });

  // Expor global para outros scripts
  window.openProfileModal = openModal;
  window.closeProfileModal = closeModal;
})();
