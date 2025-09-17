/**
 * 用户认证弹窗系统 JavaScript
 * 仿Anker风格的交互逻辑
 */

class UserAuthModals {
  constructor() {
    this.isInitialized = false;
    this.activeModal = null;
    this.hoverTimeout = null;
    
    // DOM元素引用
    this.elements = {
      accountIcon: null,
      hoverMenu: null,
      loginModal: null,
      registerModal: null
    };
    
    this.init();
  }
  
  init() {
    if (this.isInitialized) return;
    
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }
  
  setup() {
    this.findElements();
    this.bindEvents();
    this.bindAdditionalEvents();
    this.initializeDisplay();
    this.setupIframes();
    this.isInitialized = true;
  }
  
  initializeDisplay() {
    console.log('initializeDisplay called');
    // 确保hover菜单初始化完成后才显示
    if (this.elements.hoverMenu) {
      // 检查CSS是否完全加载
      const bodyStyle = window.getComputedStyle(document.body, '::before');
      const cssContent = bodyStyle.getPropertyValue('content');
      const cssLoaded = cssContent.includes('user-auth-css-loaded');
      
      console.log('CSS loaded:', cssLoaded, 'CSS content:', cssContent);
      
      if (cssLoaded) {
        // CSS已加载，安全移除内联样式
        this.elements.hoverMenu.style.display = '';
        this.elements.hoverMenu.classList.add('ready');
        console.log('Added ready class to hover menu');
      } else {
        // CSS未加载，等待CSS加载完成
        console.log('CSS not loaded, waiting...');
        this.waitForCSS();
      }
    } else {
      console.log('Hover menu not found in initializeDisplay');
    }
  }
  
  waitForCSS() {
    const maxAttempts = 10;
    let attempts = 0;
    
    const checkCSS = () => {
      attempts++;
      
      const bodyStyle = window.getComputedStyle(document.body, '::before');
      const cssContent = bodyStyle.getPropertyValue('content');
      const cssLoaded = cssContent.includes('user-auth-css-loaded');
      
      if (cssLoaded && this.elements.hoverMenu) {
        this.elements.hoverMenu.style.display = '';
        this.elements.hoverMenu.classList.add('ready');
      } else if (attempts < maxAttempts) {
        setTimeout(checkCSS, 50);
      } else {
        // 超时强制激活
        if (this.elements.hoverMenu) {
          this.elements.hoverMenu.style.display = '';
          this.elements.hoverMenu.classList.add('ready');
        }
      }
    };
    
    setTimeout(checkCSS, 10);
  }
  
  findElements() {
    // 查找相关DOM元素
    this.elements.accountIcon = document.querySelector('.header__icon--account');
    this.elements.hoverMenu = document.getElementById('authHoverMenu');
    this.elements.loginModal = document.getElementById('loginModal');
    this.elements.registerModal = document.getElementById('registerModal');
    
    // 调试信息
    console.log('UserAuthModals - Elements found:', {
      accountIcon: !!this.elements.accountIcon,
      hoverMenu: !!this.elements.hoverMenu,
      loginModal: !!this.elements.loginModal,
      registerModal: !!this.elements.registerModal
    });
    
    if (!this.elements.accountIcon) {
      console.log('Account icon not found, checking alternative selectors...');
      // 尝试其他可能的选择器
      this.elements.accountIcon = document.querySelector('[aria-label="Account"]');
      if (this.elements.accountIcon) {
        console.log('Found account icon with aria-label selector');
      }
    }
  }
  
  bindEvents() {
    // 账户图标hover事件
    if (this.elements.accountIcon) {
      console.log('Binding hover events to account icon');
      this.elements.accountIcon.addEventListener('mouseenter', () => {
        console.log('Account icon mouseenter');
        this.showHoverMenu();
      });
      this.elements.accountIcon.addEventListener('mouseleave', () => {
        console.log('Account icon mouseleave');
        this.hideHoverMenu();
      });
    } else {
      console.log('Account icon not found, cannot bind hover events');
    }
    
    // hover菜单事件
    if (this.elements.hoverMenu) {
      this.elements.hoverMenu.addEventListener('mouseenter', () => this.showHoverMenu());
      this.elements.hoverMenu.addEventListener('mouseleave', () => this.hideHoverMenu());
      
      // 菜单内按钮点击事件（fallback支持）
      this.elements.hoverMenu.addEventListener('click', (e) => {
        const modalType = e.target.getAttribute('data-modal');
        if (modalType) {
          e.preventDefault();
          this.openModal(modalType);
          this.hideHoverMenu();
        }
      });
    }
    
    // 监听来自iframe的postMessage
    window.addEventListener('message', (event) => {
      // 验证消息来源（安全考虑）
      if (event.origin !== 'https://api.lonelyhub.cn') {
        return;
      }
      
      // 处理认证相关消息
      if (event.data && event.data.type === 'auth-action') {
        this.handleAuthMessage(event.data);
      }
    });
  }
  
  // 处理来自iframe的认证消息
  handleAuthMessage(data) {
    const { action } = data;
    
    switch (action) {
      case 'login':
        this.openModal('login');
        this.hideHoverMenu();
        break;
      case 'register':
        this.openModal('register');
        this.hideHoverMenu();
        break;
      default:
        console.log('未知的认证操作:', action);
    }
  }
  
  // 补充事件绑定
  bindAdditionalEvents() {
    // 模态框通用事件绑定
    this.bindModalEvents(this.elements.loginModal);
    this.bindModalEvents(this.elements.registerModal);
    
    // 全局ESC键事件
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.closeModal();
      }
    });
    
    // 模态框切换事件
    document.addEventListener('click', (e) => {
      const modalType = e.target.getAttribute('data-modal');
      if (modalType && e.target.classList.contains('auth-form__switch')) {
        e.preventDefault();
        this.openModal(modalType);
      }
    });
  }
  
  bindModalEvents(modal) {
    if (!modal) return;
    
    // 背景点击关闭
    const backdrop = modal.querySelector('[data-modal-close]');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.closeModal();
        }
      });
    }
    
    // 关闭按钮
    const closeBtn = modal.querySelector('.auth-modal__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }
    
    // 返回按钮
    const backBtn = modal.querySelector('.auth-modal__back');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.closeModal());
    }
  }
  
  showHoverMenu() {
    console.log('showHoverMenu called');
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    
    if (this.elements.hoverMenu) {
      console.log('Adding show class to hover menu');
      this.elements.hoverMenu.classList.add('show');
      console.log('Hover menu classes:', this.elements.hoverMenu.className);
      console.log('Hover menu computed style:', window.getComputedStyle(this.elements.hoverMenu).display);
    } else {
      console.log('Hover menu element not found in showHoverMenu');
    }
  }
  
  hideHoverMenu() {
    // 延迟隐藏，给用户时间移动到菜单上
    this.hoverTimeout = setTimeout(() => {
      if (this.elements.hoverMenu) {
        this.elements.hoverMenu.classList.remove('show');
      }
    }, 100);
  }
  
  openModal(type) {
    // 关闭当前活跃的模态框
    if (this.activeModal) {
      this.closeModal();
    }
    
    let modal;
    if (type === 'login') {
      modal = this.elements.loginModal;
    } else if (type === 'register') {
      modal = this.elements.registerModal;
    }
    
    if (modal) {
      // 重置iframe状态，清除可能的fallback显示
      this.resetIframeState(modal);
      
      this.activeModal = modal;
      modal.style.display = 'block';
      
      // 强制重排，然后添加show类实现动画
      modal.offsetHeight;
      modal.classList.add('show');
      
      // 防止页面滚动
      document.body.style.overflow = 'hidden';
      
      // 聚焦到第一个输入框
      const firstInput = modal.querySelector('input[type="email"]');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }
  
  // 重置iframe状态
  resetIframeState(modal) {
    const iframe = modal.querySelector('.auth-iframe');
    const fallback = modal.querySelector('.auth-iframe-fallback');
    
    if (iframe && fallback) {
      // 确保iframe显示，fallback隐藏
      iframe.style.display = '';
      fallback.style.display = 'none';
      
      // 重新加载iframe以清除任何缓存问题
      const currentSrc = iframe.src;
      iframe.src = 'about:blank';
      setTimeout(() => {
        iframe.src = currentSrc;
      }, 50);
    }
  }
  
  closeModal() {
    if (!this.activeModal) return;
    
    const modal = this.activeModal;
    
    // 移除show类，触发关闭动画
    modal.classList.remove('show');
    
    // 动画结束后隐藏模态框
    setTimeout(() => {
      modal.style.display = 'none';
      this.activeModal = null;
      
      // 恢复页面滚动
      document.body.style.overflow = '';
    }, 200); // 与CSS transition时间匹配
  }
  
  // 工具方法：检查是否有活跃的模态框
  hasActiveModal() {
    return this.activeModal !== null;
  }
  
  // 工具方法：获取当前活跃的模态框类型
  getActiveModalType() {
    if (!this.activeModal) return null;
    
    if (this.activeModal === this.elements.loginModal) return 'login';
    if (this.activeModal === this.elements.registerModal) return 'register';
    return null;
  }
  
  // 设置iframe错误处理
  setupIframes() {
    const iframes = [
      { id: 'loginIframe', fallbackId: 'loginFallback' },
      { id: 'registerIframe', fallbackId: 'registerFallback' }
    ];
    
    iframes.forEach(({ id, fallbackId }) => {
      const iframe = document.getElementById(id);
      if (iframe) {
        let hasLoaded = false;
        
        // 设置加载超时
        const timeout = setTimeout(() => {
          if (!hasLoaded) {
            console.log(`${id} 加载超时`);
            this.showIframeFallback(iframe, fallbackId);
          }
        }, 15000); // 增加超时时间到15秒
        
        // iframe加载成功
        iframe.onload = () => {
          hasLoaded = true;
          clearTimeout(timeout);
          console.log(`${id} 加载完成`);
          // 不再尝试访问iframe内容，因为跨域访问会导致错误
          // 如果onload触发，说明iframe已经成功加载
        };
        
        // iframe加载失败
        iframe.onerror = () => {
          clearTimeout(timeout);
          console.log(`${id} 加载失败`);
          this.showIframeFallback(iframe, fallbackId);
        };
      }
    });
  }
  
  // 显示iframe失败后的备选方案
  showIframeFallback(iframe, fallbackId) {
    const container = iframe.parentElement;
    const fallback = container.querySelector('.auth-iframe-fallback');
    
    if (fallback) {
      iframe.style.display = 'none';
      fallback.style.display = 'flex';
    }
  }
}

// 全局实例化
window.userAuthModals = null;

// 确保在DOM加载后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUserAuthModals);
} else {
  initUserAuthModals();
}

function initUserAuthModals() {
  if (!window.userAuthModals) {
    window.userAuthModals = new UserAuthModals();
  }
}

// 导出供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserAuthModals;
}