/**
 * kamuy-shop.jp Theme JavaScript
 * 依存ライブラリなし（Vanilla JS）
 */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     カート数量の更新（Ajax Cart API）
     ------------------------------------------------------------------ */
  function updateCartCount() {
    fetch('/cart.js')
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        var countEl = document.getElementById('cart-count');
        if (countEl) {
          countEl.textContent = cart.item_count;
          countEl.style.display = cart.item_count > 0 ? 'flex' : 'none';
        }
      })
      .catch(function (err) {
        console.warn('Cart fetch error:', err);
      });
  }

  /* ------------------------------------------------------------------
     カートに追加（Ajax）
     ------------------------------------------------------------------ */
  function initAjaxCart() {
    document.querySelectorAll('.product-card__form').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = form.querySelector('.product-card__add-btn');
        var variantId = form.querySelector('[name="id"]').value;

        if (!variantId) return;

        btn.disabled = true;
        btn.textContent = '追加中...';

        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: variantId, quantity: 1 })
        })
          .then(function (res) { return res.json(); })
          .then(function () {
            btn.textContent = '✓ 追加しました';
            btn.style.backgroundColor = 'var(--color-member)';
            updateCartCount();
            setTimeout(function () {
              btn.textContent = 'カートに入れる';
              btn.style.backgroundColor = '';
              btn.disabled = false;
            }, 2000);
          })
          .catch(function (err) {
            console.error('Add to cart error:', err);
            btn.textContent = 'エラーが発生しました';
            btn.disabled = false;
          });
      });
    });
  }

  /* ------------------------------------------------------------------
     モバイルメニュートグル
     ------------------------------------------------------------------ */
  function initMobileMenu() {
    var toggle = document.querySelector('.header-mobile-toggle');
    var nav = document.querySelector('.header-nav');

    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !isOpen);
      nav.classList.toggle('header-nav--open', !isOpen);
    });
  }

  /* ------------------------------------------------------------------
     スムーズスクロール（アンカーリンク）
     ------------------------------------------------------------------ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     ヘッダーのスクロール追従（影の強調）
     ------------------------------------------------------------------ */
  function initHeaderScroll() {
    var header = document.querySelector('.site-header');
    if (!header) return;

    var lastScroll = 0;

    window.addEventListener('scroll', function () {
      var currentScroll = window.pageYOffset;
      if (currentScroll > 50) {
        header.classList.add('site-header--scrolled');
      } else {
        header.classList.remove('site-header--scrolled');
      }
      lastScroll = currentScroll;
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     遅延読み込み画像（Intersection Observer）
     ------------------------------------------------------------------ */
  function initLazyImages() {
    if (!('IntersectionObserver' in window)) return;

    var lazyImages = document.querySelectorAll('img[loading="lazy"]');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    lazyImages.forEach(function (img) {
      observer.observe(img);
    });
  }

  /* ------------------------------------------------------------------
     初期化
     ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    updateCartCount();
    initAjaxCart();
    initMobileMenu();
    initSmoothScroll();
    initHeaderScroll();
    initLazyImages();
  });

})();
