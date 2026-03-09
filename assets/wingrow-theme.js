/**
 * WINGROW Shopify Theme - Main JavaScript
 */
(function () {
  'use strict';

  /* =====================
     ヘッダー：検索トグル
  ===================== */
  const searchToggle = document.getElementById('search-toggle');
  const searchBar = document.getElementById('search-bar');

  if (searchToggle && searchBar) {
    searchToggle.addEventListener('click', function () {
      const isOpen = searchBar.classList.toggle('is-open');
      searchToggle.setAttribute('aria-expanded', isOpen);
      searchBar.setAttribute('aria-hidden', !isOpen);
      if (isOpen) {
        const input = searchBar.querySelector('.header__search-input');
        if (input) input.focus();
      }
    });
  }

  /* =====================
     ヘッダー：モバイルメニュー
  ===================== */
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      const isOpen = mobileMenu.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', isOpen);
      mobileMenu.setAttribute('aria-hidden', !isOpen);
    });
  }

  /* =====================
     商品ギャラリー：サムネイル切り替え
  ===================== */
  const thumbBtns = document.querySelectorAll('.product-gallery__thumb-btn');
  const mainImg = document.getElementById('product-main-img');

  thumbBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (mainImg) {
        mainImg.src = btn.dataset.src;
      }
      thumbBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });

  /* =====================
     数量ボタン（商品ページ）
  ===================== */
  function initQuantityButtons() {
    document.querySelectorAll('.quantity-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const isCartItem = btn.dataset.line;
        let input;

        if (isCartItem) {
          input = document.querySelector(
            '.cart-item__quantity-input[data-line="' + btn.dataset.line + '"]'
          );
        } else {
          input = btn.parentElement.querySelector('input[type="number"]');
        }

        if (!input) return;

        let val = parseInt(input.value, 10) || 1;

        if (btn.classList.contains('quantity-btn--plus')) {
          val++;
        } else if (btn.classList.contains('quantity-btn--minus')) {
          val = Math.max(0, val - 1);
        }

        input.value = val;

        if (isCartItem) {
          updateCartItem(btn.dataset.line, val);
        }
      });
    });
  }

  initQuantityButtons();

  /* =====================
     カートドロワー
  ===================== */
  const cartDrawer = document.getElementById('cart-drawer');
  const cartDrawerOverlay = document.getElementById('cart-drawer-overlay');
  const cartDrawerClose = document.getElementById('cart-drawer-close');
  const cartIconBubble = document.getElementById('cart-icon-bubble');

  function openCartDrawer() {
    if (!cartDrawer) return;
    cartDrawer.classList.add('is-open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    if (!cartDrawer) return;
    cartDrawer.classList.remove('is-open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (cartDrawerOverlay) cartDrawerOverlay.addEventListener('click', closeCartDrawer);
  if (cartDrawerClose) cartDrawerClose.addEventListener('click', closeCartDrawer);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCartDrawer();
  });

  /* =====================
     カートに追加（Ajax）
  ===================== */
  const productForm = document.getElementById('product-form');

  if (productForm) {
    productForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const formData = new FormData(productForm);
      const submitBtn = productForm.querySelector('[type="submit"]');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '追加中...';
      }

      fetch(window.routes.cart_add_url, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.status) {
            alert('エラーが発生しました: ' + data.description);
          } else {
            refreshCartDrawer();
            openCartDrawer();
          }
        })
        .catch(function () {
          alert('カートへの追加に失敗しました。');
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'カートに入れる';
          }
        });
    });
  }

  /* =====================
     カートドロワー更新
  ===================== */
  function refreshCartDrawer() {
    fetch(window.routes.cart_url + '.js')
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        const countEl = document.getElementById('cart-drawer-count');
        const totalEl = document.getElementById('cart-drawer-total');
        const headerCount = document.querySelector('.header__cart-count');

        if (countEl) countEl.textContent = cart.item_count;
        if (headerCount) {
          headerCount.textContent = cart.item_count;
          headerCount.style.display = cart.item_count > 0 ? '' : 'none';
        }
        if (totalEl) {
          totalEl.textContent = formatMoney(cart.total_price);
        }
      });
  }

  function updateCartItem(line, quantity) {
    fetch(window.routes.cart_change_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ line: line, quantity: quantity })
    })
      .then(function (res) { return res.json(); })
      .then(function () {
        if (quantity === 0) {
          location.reload();
        } else {
          refreshCartDrawer();
        }
      });
  }

  function formatMoney(cents) {
    return '¥' + (cents / 100).toLocaleString('ja-JP');
  }

  /* =====================
     コレクション：ソート変更
  ===================== */
  const sortSelect = document.getElementById('SortBy');
  if (sortSelect) {
    sortSelect.addEventListener('change', function () {
      const url = new URL(window.location.href);
      url.searchParams.set('sort_by', this.value);
      window.location.href = url.toString();
    });
  }

  /* =====================
     スクロールアニメーション
  ===================== */
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.product-card, .category-card, .section-header').forEach(function (el) {
      el.classList.add('fade-in');
      observer.observe(el);
    });
  }

})();
