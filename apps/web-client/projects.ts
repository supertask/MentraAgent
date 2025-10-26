/**
 * プロジェクト管理ページ
 */

const API_BASE_URL = 'http://localhost:3000';

// DOM要素
const projectsGrid = document.getElementById('projects-grid') as HTMLDivElement;
const emptyState = document.getElementById('empty-state') as HTMLDivElement;
const loadingState = document.getElementById('loading-state') as HTMLDivElement;

const newProjectButton = document.getElementById('new-project-button') as HTMLButtonElement;
const emptyNewProjectButton = document.getElementById('empty-new-project-button') as HTMLButtonElement;

// プロジェクトモーダル
const projectModal = document.getElementById('project-modal') as HTMLDivElement;
const modalTitle = document.getElementById('modal-title') as HTMLHeadingElement;
const closeModal = document.getElementById('close-modal') as HTMLButtonElement;
const cancelModal = document.getElementById('cancel-modal') as HTMLButtonElement;
const projectIdInput = document.getElementById('project-id') as HTMLInputElement;
const projectNameInput = document.getElementById('project-name') as HTMLInputElement;
const githubRepoInput = document.getElementById('github-repo') as HTMLInputElement;
const githubBranchInput = document.getElementById('github-branch') as HTMLInputElement;
const githubSubdirectoryInput = document.getElementById('github-subdirectory') as HTMLInputElement;
const saveProjectButton = document.getElementById('save-project-button') as HTMLButtonElement;

// 削除モーダル
const deleteModal = document.getElementById('delete-modal') as HTMLDivElement;
const closeDeleteModal = document.getElementById('close-delete-modal') as HTMLButtonElement;
const cancelDeleteModal = document.getElementById('cancel-delete-modal') as HTMLButtonElement;
const deleteMessage = document.getElementById('delete-message') as HTMLParagraphElement;
const confirmDeleteButton = document.getElementById('confirm-delete-button') as HTMLButtonElement;

let currentDeleteProjectId: string | null = null;

// プロジェクト一覧を取得して表示
async function loadProjects() {
  try {
    showLoading();
    
    const response = await fetch(`${API_BASE_URL}/api/projects`);
    if (!response.ok) {
      throw new Error('プロジェクトの取得に失敗しました');
    }
    
    const data = await response.json();
    const projects = data.projects || [];
    
    hideLoading();
    
    if (projects.length === 0) {
      showEmptyState();
    } else {
      hideEmptyState();
      renderProjects(projects);
    }
  } catch (error) {
    hideLoading();
    console.error('プロジェクト取得エラー:', error);
    alert('プロジェクトの取得に失敗しました');
  }
}

// プロジェクトカードをレンダリング
function renderProjects(projects: any[]) {
  projectsGrid.innerHTML = '';
  
  projects.forEach(project => {
    const card = createProjectCard(project);
    projectsGrid.appendChild(card);
  });
}

// プロジェクトカードを作成
function createProjectCard(project: any): HTMLElement {
  const card = document.createElement('div');
  card.className = 'project-card';
  
  const hasGithub = project.githubRepo && project.githubRepo !== 'null';
  const githubUrl = hasGithub ? project.githubRepo : null;
  const branch = project.githubBranch || 'main';
  const documentCount = project.documentCount || 0;
  
  // 日付のフォーマット
  const createdDate = new Date(project.createdAt).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  card.innerHTML = `
    <div class="project-card-header">
      <h3 class="project-name">📁 ${escapeHtml(project.name)}</h3>
    </div>
    
    <div class="project-card-body">
      ${githubUrl ? `
        <div class="github-info">
          <div class="github-repo">
            <span class="label">GitHub:</span>
            <a href="${escapeHtml(githubUrl)}" target="_blank" rel="noopener noreferrer" class="github-link">
              ${formatGithubUrl(githubUrl)}
            </a>
          </div>
          <div class="github-branch">
            <span class="label">ブランチ:</span>
            <code>${escapeHtml(branch)}</code>
          </div>
          ${project.githubSubDirectory ? `
            <div class="github-subdirectory">
              <span class="label">サブディレクトリ:</span>
              <code>${escapeHtml(project.githubSubDirectory)}</code>
            </div>
          ` : ''}
        </div>
      ` : `
        <div class="github-info no-github">
          <span class="warning-text">⚠️ GitHubリポジトリ未設定</span>
          <p class="help-text">Cursor Agentを使用する場合は設定してください</p>
        </div>
      `}
      
      <div class="project-card-meta">
        <div class="meta-item">
          <span class="meta-label">ドキュメント:</span>
          <span class="meta-value">${documentCount}件</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">作成日:</span>
          <span class="meta-value">${createdDate}</span>
        </div>
      </div>
    </div>
    
    <div class="project-card-actions">
      <button class="edit-button secondary-button" data-project-id="${project.id}">
        ✏️ 編集
      </button>
      <button class="delete-button danger-button" data-project-id="${project.id}">
        🗑️ 削除
      </button>
    </div>
  `;
  
  // イベントリスナーを追加
  const editButton = card.querySelector('.edit-button') as HTMLButtonElement;
  const deleteButton = card.querySelector('.delete-button') as HTMLButtonElement;
  
  editButton.addEventListener('click', () => openEditModal(project));
  deleteButton.addEventListener('click', () => openDeleteModal(project));
  
  return card;
}

// GitHub URLを短縮表示
function formatGithubUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // 先頭の "/" を削除
  } catch {
    return url;
  }
}

// HTMLエスケープ
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 作成モーダルを開く
function openCreateModal() {
  modalTitle.textContent = '📁 新規プロジェクト';
  projectIdInput.value = '';
  projectNameInput.value = '';
  githubRepoInput.value = '';
  githubBranchInput.value = 'main';
  githubSubdirectoryInput.value = '';
  saveProjectButton.textContent = '💾 保存';
  projectModal.classList.remove('hidden');
  projectNameInput.focus();
}

// 編集モーダルを開く
function openEditModal(project: any) {
  modalTitle.textContent = '✏️ プロジェクト編集';
  projectIdInput.value = project.id;
  projectNameInput.value = project.name;
  githubRepoInput.value = project.githubRepo || '';
  githubBranchInput.value = project.githubBranch || 'main';
  githubSubdirectoryInput.value = project.githubSubDirectory || '';
  saveProjectButton.textContent = '💾 更新';
  projectModal.classList.remove('hidden');
  projectNameInput.focus();
}

// モーダルを閉じる
function closeProjectModal() {
  projectModal.classList.add('hidden');
}

// プロジェクトを保存（作成または更新）
async function saveProject() {
  const projectId = projectIdInput.value;
  const name = projectNameInput.value.trim();
  const githubRepo = githubRepoInput.value.trim();
  const githubBranch = githubBranchInput.value.trim() || 'main';
  const githubSubDirectory = githubSubdirectoryInput.value.trim();
  
  if (!name) {
    alert('プロジェクト名を入力してください');
    projectNameInput.focus();
    return;
  }
  
  const body: any = { name };
  if (githubRepo) {
    body.githubRepo = githubRepo;
    body.githubBranch = githubBranch;
    if (githubSubDirectory) {
      body.githubSubDirectory = githubSubDirectory;
    }
  }
  
  saveProjectButton.disabled = true;
  saveProjectButton.textContent = projectId ? '更新中...' : '作成中...';
  
  try {
    const url = projectId 
      ? `${API_BASE_URL}/api/projects/${projectId}`
      : `${API_BASE_URL}/api/projects`;
    
    const method = projectId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || '保存に失敗しました');
    }
    
    closeProjectModal();
    await loadProjects();
    
    const action = projectId ? '更新' : '作成';
    showNotification(`✅ プロジェクト「${name}」を${action}しました`, 'success');
  } catch (error: any) {
    alert(`❌ エラー: ${error.message}`);
  } finally {
    saveProjectButton.disabled = false;
    saveProjectButton.textContent = projectId ? '💾 更新' : '💾 保存';
  }
}

// 削除モーダルを開く
function openDeleteModal(project: any) {
  currentDeleteProjectId = project.id;
  deleteMessage.textContent = `「${project.name}」を削除しますか？`;
  deleteModal.classList.remove('hidden');
}

// 削除モーダルを閉じる
function closeDeleteModalFn() {
  deleteModal.classList.add('hidden');
  currentDeleteProjectId = null;
}

// プロジェクトを削除
async function deleteProject() {
  if (!currentDeleteProjectId) return;
  
  confirmDeleteButton.disabled = true;
  confirmDeleteButton.textContent = '削除中...';
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/projects/${currentDeleteProjectId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('削除に失敗しました');
    }
    
    closeDeleteModalFn();
    await loadProjects();
    
    showNotification('✅ プロジェクトを削除しました', 'success');
  } catch (error: any) {
    alert(`❌ エラー: ${error.message}`);
  } finally {
    confirmDeleteButton.disabled = false;
    confirmDeleteButton.textContent = '🗑️ 削除する';
  }
}

// 通知を表示
function showNotification(message: string, type: 'success' | 'error' = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ローディング表示
function showLoading() {
  loadingState.classList.remove('hidden');
  projectsGrid.classList.add('hidden');
  emptyState.classList.add('hidden');
}

function hideLoading() {
  loadingState.classList.add('hidden');
  projectsGrid.classList.remove('hidden');
}

// 空状態の表示/非表示
function showEmptyState() {
  emptyState.classList.remove('hidden');
  projectsGrid.classList.add('hidden');
}

function hideEmptyState() {
  emptyState.classList.add('hidden');
  projectsGrid.classList.remove('hidden');
}

// イベントリスナーの設定
newProjectButton.addEventListener('click', openCreateModal);
emptyNewProjectButton.addEventListener('click', openCreateModal);

closeModal.addEventListener('click', closeProjectModal);
cancelModal.addEventListener('click', closeProjectModal);
saveProjectButton.addEventListener('click', saveProject);

closeDeleteModal.addEventListener('click', closeDeleteModalFn);
cancelDeleteModal.addEventListener('click', closeDeleteModalFn);
confirmDeleteButton.addEventListener('click', deleteProject);

// モーダル外クリックで閉じる
projectModal.addEventListener('click', (e) => {
  if (e.target === projectModal) {
    closeProjectModal();
  }
});

deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) {
    closeDeleteModalFn();
  }
});

// Enterキーで保存
projectNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    saveProject();
  }
});

// 初期読み込み
loadProjects();

