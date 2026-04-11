/**
 * WinGrow EC Site - Shopify Theme JavaScript
 * wg- プレフィックスで Shopify 既存 JS と競合を回避
 */

document.addEventListener('DOMContentLoaded', function () {

  // ============================================
  // Hero Slider (3-column peek style)
  // ============================================
  const heroTrack = document.getElementById('wgHeroTrack');
  const slides = document.querySelectorAll('.wg-hero__slide');
  const dots = document.querySelectorAll('.wg-hero__dot');
  const totalSlides = slides.length;
  let currentSlide = 0;
  let sliderInterval;

  function updateSlider(index) {
    // アクティブクラスをリセット
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    // アクティブを設定
    slides[index].classList.add('active');
    dots[index].classList.add('active');

    // トラック位置を計算
    // 各スライドは65%幅、アクティブスライドを中央に配置
    // 左右のpeek = (100% - 65%) / 2 = 17.5%
    // offset = index * 65% - 17.5%
    const slideWidth = 65; // percent
    const peekWidth = (100 - slideWidth) / 2; // 17.5%
    const offset = index * slideWidth - peekWidth;
    heroTrack.style.transform = `translateX(-${offset}%)`;
  }

  function nextSlide() {
    const next = (currentSlide + 1) % totalSlides;
    currentSlide = next;
    updateSlider(currentSlide);
  }

  function startSlider() {
    sliderInterval = setInterval(nextSlide, 4500);
  }

  function stopSlider() {
    clearInterval(sliderInterval);
  }

  if (slides.length > 0) {
    // 初期化
    updateSlider(0);

    // ドットクリック
    dots.forEach((dot, index) => {
      dot.addEventListener('click', function () {
        stopSlider();
        currentSlide = index;
        updateSlider(currentSlide);
        startSlider();
      });
    });

    // サイドスライドをクリックしてナビゲート
    slides.forEach((slide, index) => {
      slide.addEventListener('click', function () {
        if (index !== currentSlide) {
          stopSlider();
          currentSlide = index;
          updateSlider(currentSlide);
          startSlider();
        }
      });
    });

    startSlider();
  }

  // ============================================
  // Sticky Header Shadow
  // ============================================
  const header = document.querySelector('.wg-header');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 10) {
        header.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
      } else {
        header.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }
    });
  }

  // ============================================
  // Cart Badge Counter (Shopify Ajax Cart API 対応)
  // ============================================
  const cartBadge = document.querySelector('.wg-cart-badge');

  // Shopify カート更新イベントを購読
  document.addEventListener('cart:change', function (event) {
    if (cartBadge && event.detail && event.detail.cart) {
      const count = event.detail.cart.item_count;
      cartBadge.textContent = count;
    }
  });

  // カートボタンのクリック処理（Ajax でカートに追加）
  const cartBtns = document.querySelectorAll('.wg-btn-cart');
  cartBtns.forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const variantId = this.dataset.variantId;

      if (!variantId) return;

      const originalHTML = this.innerHTML;
      this.disabled = true;

      // Shopify Ajax Cart API でカートに追加
      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity: 1 })
      })
        .then(res => res.json())
        .then(() => {
          // カートの件数を更新
          return fetch('/cart.js');
        })
        .then(res => res.json())
        .then(cart => {
          if (cartBadge) {
            cartBadge.textContent = cart.item_count;
          }

          // 完了アニメーション
          this.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            カートに追加しました
          `;
          this.style.background = '#2ecc71';
          setTimeout(() => {
            this.innerHTML = originalHTML;
            this.style.background = '';
            this.disabled = false;
          }, 1500);
        })
        .catch(() => {
          this.disabled = false;
        });
    });
  });

  // ============================================
  // Purpose Tags Toggle
  // ============================================
  const purposeTags = document.querySelectorAll('.wg-purpose__tag');
  purposeTags.forEach(tag => {
    tag.addEventListener('click', function (e) {
      e.preventDefault();
      this.classList.toggle('active');
      if (this.classList.contains('active')) {
        this.style.background = 'var(--wg-color-text)';
        this.style.color = '#fff';
      } else {
        this.style.background = '#fff';
        this.style.color = 'var(--wg-color-text)';
      }
    });
  });

  // ============================================
  // Intersection Observer for Fade-in Animation
  // ============================================
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('wg-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.wg-product-card, .wg-category-card, .wg-purpose__image-card').forEach(el => {
    el.classList.add('wg-fade-in');
    observer.observe(el);
  });

  // ============================================
  // Product Gallery Thumbnail Switcher
  // ============================================
  const productMainImg = document.getElementById('product-main-img');
  const thumbBtns = document.querySelectorAll('.wg-product-gallery__thumb-btn');

  if (productMainImg && thumbBtns.length > 0) {
    thumbBtns.forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const newSrc = this.dataset.src;
        if (!newSrc) return;

        // メイン画像を切り替え
        productMainImg.src = newSrc;

        // アクティブ状態を更新
        thumbBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
      });
    });
  }

});
