/* ============================================================
   PROJETOS.JS
   Portfólio de Projetos — Lucas Padroni

   Responsabilidades:
   - Menu mobile
   - 16 carrosséis independentes
   - Navegação anterior / próxima
   - Navegação por teclado
   - Swipe / touch
   - Contador dos carrosséis
   - Controle de reprodução dos vídeos
   - Botão voltar ao topo
   - Respeito à preferência de movimento reduzido

   Não controla:
   - Layout
   - Cores
   - Tipografia
   - Conteúdo textual
   - Estilização
   ============================================================ */

"use strict";

/* ============================================================
   CONFIGURAÇÕES
   ============================================================ */

const CONFIG = {
    selectors: {
        menuToggle: ".menu-toggle",
        navigation: ".main-navigation",
        navigationLinks: ".main-navigation a",

        carousel: ".carousel",
        carouselImage: ".carousel__image",
        carouselPrevious: ".carousel__button--prev",
        carouselNext: ".carousel__button--next",
        carouselCounter: ".carousel__counter",

        video: ".project-video",

        backToTop: ".back-to-top"
    },

    classes: {
        active: "is-active",
        visible: "is-visible"
    },

    breakpoints: {
        mobile: 768
    },

    swipe: {
        minimumDistance: 45
    }
};


/* ============================================================
   ESTADO GLOBAL
   ============================================================ */

const state = {
    carousels: [],
    menuOpen: false
};


/* ============================================================
   UTILITÁRIOS
   ============================================================ */

/**
 * Seleciona um elemento.
 */
function select(selector, parent = document) {
    return parent.querySelector(selector);
}


/**
 * Seleciona vários elementos.
 */
function selectAll(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
}


/**
 * Verifica se o usuário prefere reduzir animações.
 */
function prefersReducedMotion() {
    return window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;
}


/**
 * Formata números com dois dígitos.
 *
 * 1  -> 01
 * 5  -> 05
 * 10 -> 10
 */
function formatNumber(number) {
    return String(number).padStart(2, "0");
}


/* ============================================================
   MENU MOBILE
   ============================================================ */

function initializeMobileMenu() {
    const menuToggle = select(CONFIG.selectors.menuToggle);
    const navigation = select(CONFIG.selectors.navigation);

    if (!menuToggle || !navigation) {
        return;
    }

    function setMenuState(open) {
        state.menuOpen = open;

        menuToggle.setAttribute(
            "aria-expanded",
            String(open)
        );

        navigation.classList.toggle(
            "is-open",
            open
        );

        document.body.classList.toggle(
            "menu-open",
            open
        );
    }


    function toggleMenu() {
        setMenuState(!state.menuOpen);
    }


    function closeMenu() {
        if (!state.menuOpen) {
            return;
        }

        setMenuState(false);
    }


    menuToggle.addEventListener("click", toggleMenu);


    const navigationLinks = selectAll(
        CONFIG.selectors.navigationLinks
    );

    navigationLinks.forEach((link) => {
        link.addEventListener("click", closeMenu);
    });


    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });


    document.addEventListener("click", (event) => {
        if (!state.menuOpen) {
            return;
        }

        const clickedInsideNavigation =
            navigation.contains(event.target);

        const clickedToggle =
            menuToggle.contains(event.target);

        if (!clickedInsideNavigation && !clickedToggle) {
            closeMenu();
        }
    });


    window.addEventListener("resize", () => {
        if (window.innerWidth > CONFIG.breakpoints.mobile) {
            closeMenu();
        }
    });
}


/* ============================================================
   CARROSSEL
   ============================================================ */

class ProjectCarousel {
    constructor(element, index) {
        this.element = element;
        this.index = index;

        this.slides = selectAll(
            CONFIG.selectors.carouselImage,
            element
        );

        this.previousButton = select(
            CONFIG.selectors.carouselPrevious,
            element
        );

        this.nextButton = select(
            CONFIG.selectors.carouselNext,
            element
        );

        this.counter = select(
            CONFIG.selectors.carouselCounter,
            element
        );

        this.currentSlide = this.findInitialSlide();

        this.pointerStartX = 0;
        this.pointerStartY = 0;
        this.pointerCurrentX = 0;
        this.isPointerDown = false;

        this.totalSlides = this.slides.length;

        this.initialize();
    }


    /* --------------------------------------------------------
       Inicialização
       -------------------------------------------------------- */

    initialize() {
        if (this.totalSlides === 0) {
            return;
        }

        this.prepareAccessibility();
        this.bindButtons();
        this.bindKeyboard();
        this.bindPointerEvents();
        this.update();
    }


    /* --------------------------------------------------------
       Slide inicial
       -------------------------------------------------------- */

    findInitialSlide() {
        const activeIndex = this.slides.findIndex(
            (slide) =>
                slide.classList.contains(
                    CONFIG.classes.active
                )
        );

        return activeIndex >= 0
            ? activeIndex
            : 0;
    }


    /* --------------------------------------------------------
       Acessibilidade
       -------------------------------------------------------- */

    prepareAccessibility() {
        this.element.setAttribute(
            "role",
            "region"
        );

        this.element.setAttribute(
            "aria-roledescription",
            "carrossel"
        );

        if (!this.element.hasAttribute("tabindex")) {
            this.element.setAttribute(
                "tabindex",
                "0"
            );
        }

        if (this.previousButton) {
            this.previousButton.setAttribute(
                "aria-label",
                "Projeto anterior"
            );
        }

        if (this.nextButton) {
            this.nextButton.setAttribute(
                "aria-label",
                "Próximo projeto"
            );
        }

        this.slides.forEach((slide, index) => {
            slide.setAttribute(
                "aria-hidden",
                index === this.currentSlide
                    ? "false"
                    : "true"
            );
        });

        if (this.counter) {
            this.counter.setAttribute(
                "aria-live",
                "polite"
            );
        }
    }


    /* --------------------------------------------------------
       Botões
       -------------------------------------------------------- */

    bindButtons() {
        if (this.previousButton) {
            this.previousButton.addEventListener(
                "click",
                () => this.previous()
            );
        }

        if (this.nextButton) {
            this.nextButton.addEventListener(
                "click",
                () => this.next()
            );
        }
    }


    /* --------------------------------------------------------
       Navegação por teclado
       -------------------------------------------------------- */

    bindKeyboard() {
        this.element.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key !== "ArrowLeft" &&
                    event.key !== "ArrowRight"
                ) {
                    return;
                }

                event.preventDefault();

                if (event.key === "ArrowLeft") {
                    this.previous();
                }

                if (event.key === "ArrowRight") {
                    this.next();
                }
            }
        );
    }


    /* --------------------------------------------------------
       Pointer / Touch / Swipe
       -------------------------------------------------------- */

    bindPointerEvents() {
        this.element.addEventListener(
            "pointerdown",
            (event) => {
                this.handlePointerDown(event);
            }
        );

        this.element.addEventListener(
            "pointermove",
            (event) => {
                this.handlePointerMove(event);
            }
        );

        this.element.addEventListener(
            "pointerup",
            (event) => {
                this.handlePointerUp(event);
            }
        );

        this.element.addEventListener(
            "pointercancel",
            () => {
                this.resetPointer();
            }
        );

        this.element.addEventListener(
            "pointerleave",
            () => {
                if (this.isPointerDown) {
                    this.resetPointer();
                }
            }
        );
    }


    handlePointerDown(event) {
        /*
         * Ignora interação com os próprios botões.
         */
        if (
            event.target.closest(
                ".carousel__button"
            )
        ) {
            return;
        }

        this.isPointerDown = true;

        this.pointerStartX = event.clientX;
        this.pointerStartY = event.clientY;

        this.pointerCurrentX = event.clientX;

        try {
            this.element.setPointerCapture(
                event.pointerId
            );
        } catch {
            // Alguns ambientes não suportam setPointerCapture.
        }
    }


    handlePointerMove(event) {
        if (!this.isPointerDown) {
            return;
        }

        this.pointerCurrentX = event.clientX;
    }


    handlePointerUp(event) {
        if (!this.isPointerDown) {
            return;
        }

        const deltaX =
            this.pointerCurrentX -
            this.pointerStartX;

        const deltaY =
            event.clientY -
            this.pointerStartY;

        /*
         * Se o movimento vertical for maior que o horizontal,
         * provavelmente é scroll da página, não swipe.
         */
        if (
            Math.abs(deltaY) >
            Math.abs(deltaX)
        ) {
            this.resetPointer();
            return;
        }

        if (
            Math.abs(deltaX) >=
            CONFIG.swipe.minimumDistance
        ) {
            if (deltaX < 0) {
                this.next();
            } else {
                this.previous();
            }
        }

        this.resetPointer();
    }


    resetPointer() {
        this.isPointerDown = false;
        this.pointerStartX = 0;
        this.pointerStartY = 0;
        this.pointerCurrentX = 0;
    }


    /* --------------------------------------------------------
       Próximo slide
       -------------------------------------------------------- */

    next() {
        if (this.totalSlides <= 1) {
            return;
        }

        this.currentSlide =
            (this.currentSlide + 1) %
            this.totalSlides;

        this.update();
    }


    /* --------------------------------------------------------
       Slide anterior
       -------------------------------------------------------- */

    previous() {
        if (this.totalSlides <= 1) {
            return;
        }

        this.currentSlide =
            (
                this.currentSlide -
                1 +
                this.totalSlides
            ) %
            this.totalSlides;

        this.update();
    }


    /* --------------------------------------------------------
       Atualização visual
       -------------------------------------------------------- */

    update() {
        this.slides.forEach(
            (slide, index) => {
                const isActive =
                    index === this.currentSlide;

                slide.classList.toggle(
                    CONFIG.classes.active,
                    isActive
                );

                slide.setAttribute(
                    "aria-hidden",
                    String(!isActive)
                );
            }
        );

        this.updateCounter();
    }


    /* --------------------------------------------------------
       Contador
       -------------------------------------------------------- */

    updateCounter() {
        if (!this.counter) {
            return;
        }

        const counterParts =
            this.counter.querySelectorAll(
                "span"
            );

        if (counterParts.length === 0) {
            return;
        }

        counterParts[0].textContent =
            formatNumber(
                this.currentSlide + 1
            );

        /*
         * Mantém o total sincronizado com o número real
         * de imagens encontradas no HTML.
         */
        if (counterParts.length >= 3) {
            counterParts[2].textContent =
                formatNumber(
                    this.totalSlides
                );
        }
    }
}


/* ============================================================
   INICIALIZAÇÃO DOS CARROSSÉIS
   ============================================================ */

function initializeCarousels() {
    const carouselElements = selectAll(
        CONFIG.selectors.carousel
    );

    if (carouselElements.length === 0) {
        return;
    }

    carouselElements.forEach(
        (carouselElement, index) => {
            const carousel =
                new ProjectCarousel(
                    carouselElement,
                    index
                );

            state.carousels.push(
                carousel
            );
        }
    );
}


/* ============================================================
   CONTROLE DE VÍDEOS
   ============================================================ */

function initializeVideos() {
    const videos = selectAll(
        CONFIG.selectors.video
    );

    if (videos.length === 0) {
        return;
    }

    videos.forEach((video) => {
        /*
         * Impede que múltiplos vídeos fiquem reproduzindo
         * simultaneamente.
         */
        video.addEventListener(
            "play",
            () => {
                videos.forEach((otherVideo) => {
                    if (
                        otherVideo !== video &&
                        !otherVideo.paused
                    ) {
                        otherVideo.pause();
                    }
                });
            }
        );


        /*
         * Quando o vídeo termina, retorna ao início.
         * Não inicia novamente automaticamente.
         */
        video.addEventListener(
            "ended",
            () => {
                video.currentTime = 0;
            }
        );
    });
}


/* ============================================================
   BOTÃO VOLTAR AO TOPO
   ============================================================ */

function initializeBackToTop() {
    const backToTop = select(
        CONFIG.selectors.backToTop
    );

    if (!backToTop) {
        return;
    }


    function updateVisibility() {
        const shouldShow =
            window.scrollY > 500;

        backToTop.classList.toggle(
            CONFIG.classes.visible,
            shouldShow
        );
    }


    function scrollToTop(event) {
        event.preventDefault();

        window.scrollTo({
            top: 0,
            behavior: prefersReducedMotion()
                ? "auto"
                : "smooth"
        });
    }


    backToTop.addEventListener(
        "click",
        scrollToTop
    );


    window.addEventListener(
        "scroll",
        updateVisibility,
        {
            passive: true
        }
    );


    updateVisibility();
}


/* ============================================================
   NAVEGAÇÃO INTERNA ENTRE ÁREAS
   ============================================================ */

function initializeAreaNavigation() {
    const areaLinks = selectAll(
        'a[href^="#"]'
    );

    if (areaLinks.length === 0) {
        return;
    }

    areaLinks.forEach((link) => {
        link.addEventListener(
            "click",
            (event) => {
                const targetId =
                    link.getAttribute("href");

                if (
                    !targetId ||
                    targetId === "#"
                ) {
                    return;
                }

                const target =
                    document.querySelector(
                        targetId
                    );

                if (!target) {
                    return;
                }

                /*
                 * Permite que o navegador trate normalmente
                 * links que não são âncoras reais da página.
                 */
                event.preventDefault();

                const header =
                    select(".site-header");

                const headerHeight =
                    header
                        ? header.offsetHeight
                        : 0;

                const targetPosition =
                    target.getBoundingClientRect()
                        .top +
                    window.scrollY -
                    headerHeight -
                    20;

                window.scrollTo({
                    top: Math.max(
                        0,
                        targetPosition
                    ),
                    behavior:
                        prefersReducedMotion()
                            ? "auto"
                            : "smooth"
                });

                /*
                 * Atualiza a URL sem provocar
                 * um novo salto de página.
                 */
                if (
                    window.history &&
                    window.history.replaceState
                ) {
                    window.history.replaceState(
                        null,
                        "",
                        targetId
                    );
                }
            }
        );
    });
}


/* ============================================================
   HEADER — EFEITO DURANTE SCROLL
   ============================================================ */

function initializeHeaderScroll() {
    const header = select(
        ".site-header"
    );

    if (!header) {
        return;
    }

    let ticking = false;


    function updateHeader() {
        const scrolled =
            window.scrollY > 20;

        header.classList.toggle(
            "is-scrolled",
            scrolled
        );

        ticking = false;
    }


    window.addEventListener(
        "scroll",
        () => {
            if (!ticking) {
                window.requestAnimationFrame(
                    updateHeader
                );

                ticking = true;
            }
        },
        {
            passive: true
        }
    );


    updateHeader();
}


/* ============================================================
   REVEAL DAS ÁREAS
   ============================================================ */

function initializeReveal() {
    /*
     * Se o usuário optou por reduzir movimento,
     * não adiciona animações de entrada.
     */
    if (prefersReducedMotion()) {
        return;
    }

    /*
     * Os elementos são apenas preparados caso o CSS
     * utilize a classe .reveal.
     *
     * Isso mantém a responsabilidade visual no CSS.
     */
    const elements = selectAll(
        [
            ".project-area",
            ".project-card",
            ".projects-index__item",
            ".projects-closing__box"
        ].join(", ")
    );

    if (elements.length === 0) {
        return;
    }


    if (
        !("IntersectionObserver" in window)
    ) {
        elements.forEach(
            (element) => {
                element.classList.add(
                    "is-visible"
                );
            }
        );

        return;
    }


    const observer =
        new IntersectionObserver(
            (entries, observerInstance) => {
                entries.forEach(
                    (entry) => {
                        if (!entry.isIntersecting) {
                            return;
                        }

                        entry.target.classList.add(
                            "is-visible"
                        );

                        observerInstance.unobserve(
                            entry.target
                        );
                    }
                );
            },
            {
                threshold: 0.08,
                rootMargin: "0px 0px -40px 0px"
            }
        );


    elements.forEach((element) => {
        observer.observe(element);
    });
}


/* ============================================================
   PROTEÇÃO CONTRA LINKS VAZIOS
   ============================================================ */

function initializeSafeLinks() {
    const links = selectAll(
        'a[href="#"]'
    );

    links.forEach((link) => {
        link.addEventListener(
            "click",
            (event) => {
                event.preventDefault();
            }
        );
    });
}


/* ============================================================
   EVENTOS GERAIS
   ============================================================ */

function initializeGeneralEvents() {
    /*
     * Impede que o contexto do navegador seja
     * interferido. Esta função existe apenas como
     * ponto central para futuras extensões.
     */
}


/* ============================================================
   INICIALIZAÇÃO PRINCIPAL
   ============================================================ */

function initializeProjectsPage() {
    initializeMobileMenu();
    initializeCarousels();
    initializeVideos();
    initializeBackToTop();
    initializeAreaNavigation();
    initializeHeaderScroll();
    initializeReveal();
    initializeSafeLinks();
    initializeGeneralEvents();

    document.documentElement.classList.add(
        "js-enabled"
    );
}


/* ============================================================
   EXECUÇÃO
   ============================================================ */

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeProjectsPage,
        {
            once: true
        }
    );
} else {
    initializeProjectsPage();
}
