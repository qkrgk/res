let currentMeal = null;
let currentTranslatedName = "";
let currentRating = 0;

async function translate(text) {

    if (!text) return "";

    try {

        const res = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ko&dt=t&q=${encodeURIComponent(text)}`
        );

        const data = await res.json();

        return data[0]
            .map(item => item[0])
            .join("");

    } catch {

        return text;

    }
}

function createStars(selected = 0) {

    let html = "";

    for (let i = 1; i <= 5; i++) {

        html += `
            <span
                class="star ${i <= selected ? 'active' : ''}"
                onclick="setRating(${i})"
            >
                ★
            </span>
        `;
    }

    return html;
}

function setRating(value) {

    currentRating = value;

    const stars =
        document.querySelectorAll(".star");

    stars.forEach((star, index) => {

        if (index < value) {
            star.classList.add("active");
        } else {
            star.classList.remove("active");
        }

    });
}

function saveBookmark() {

    if (!currentMeal) return;

    let bookmarks =
        JSON.parse(
            localStorage.getItem("chefBookmarks")
        ) || [];

    if (
        bookmarks.some(
            item =>
                item.idMeal === currentMeal.idMeal
        )
    ) {

        alert("이미 저장된 메뉴입니다.");
        return;

    }

    bookmarks.push({

        idMeal: currentMeal.idMeal,

        translatedName:
            currentTranslatedName,

        rating:
            currentRating,

        meal:
            currentMeal

    });

    localStorage.setItem(
        "chefBookmarks",
        JSON.stringify(bookmarks)
    );

    renderBookmarks();

    alert("메뉴가 저장되었습니다.");
}

function deleteBookmark(id) {

    let bookmarks =
        JSON.parse(
            localStorage.getItem("chefBookmarks")
        ) || [];

    bookmarks =
        bookmarks.filter(
            item => item.idMeal !== id
        );

    localStorage.setItem(
        "chefBookmarks",
        JSON.stringify(bookmarks)
    );

    renderBookmarks();
}

function renderBookmarks() {

    const box =
        document.getElementById("bookmarks");

    const count =
        document.getElementById("bookmarkCount");

    const bookmarks =
        JSON.parse(
            localStorage.getItem("chefBookmarks")
        ) || [];

    count.textContent =
        `${bookmarks.length}개 저장됨`;

    if (bookmarks.length === 0) {

        box.innerHTML = `
            <div class="empty-bookmark">
                저장된 메뉴가 없습니다.
            </div>
        `;

        return;
    }

    box.innerHTML =
        bookmarks.map(item => `

            <div class="bookmark-item">

                <div
                    class="bookmark-title"
                    onclick="openBookmark('${item.idMeal}')"
                >
                    🍽️ ${item.translatedName}
                </div>

                <div class="bookmark-rating">
                    ${"⭐".repeat(item.rating || 0)}
                </div>

                <button
                    class="delete-btn"
                    onclick="deleteBookmark('${item.idMeal}')"
                >
                    삭제
                </button>

            </div>

        `).join("");
}

function openBookmark(id) {

    const bookmarks =
        JSON.parse(
            localStorage.getItem("chefBookmarks")
        ) || [];

    const item =
        bookmarks.find(
            meal => meal.idMeal === id
        );

    if (!item) return;

    currentMeal = item.meal;
    currentTranslatedName =
        item.translatedName;
    currentRating =
        item.rating || 0;

    showMeal(
        item.meal,
        item.translatedName,
        item.rating || 0
    );

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

async function showMeal(
    meal,
    translatedName,
    rating = 0
) {

    const recipeCard =
        document.getElementById("recipeCard");

    const area =
        await translate(meal.strArea);

    const category =
        await translate(meal.strCategory);

    const instructions =
        await translate(
            meal.strInstructions
        );

    let ingredients = "";

    for (let i = 1; i <= 20; i++) {

        const ingredient =
            meal["strIngredient" + i];

        const measure =
            meal["strMeasure" + i];

        if (
            ingredient &&
            ingredient.trim() !== ""
        ) {

            const ingredientKo =
                await translate(
                    ingredient
                );

            ingredients += `
                <li>
                    ${ingredientKo}
                    ${measure}
                </li>
            `;
        }
    }

    recipeCard.innerHTML = `

        <img
            class="recipe-image"
            src="${meal.strMealThumb}"
            alt="${translatedName}"
        >

        <div class="recipe-content">

            <div class="recipe-title">
                ${translatedName}
            </div>

            <div class="recipe-tags">

                <div class="tag">
                    🌍 ${area}
                </div>

                <div class="tag">
                    🍽️ ${category}
                </div>

            </div>

            <div class="action-row">

                <button
                    class="save-btn"
                    onclick="saveBookmark()"
                >
                    📖 메뉴북 저장
                </button>

                <div class="rating">
                    ${createStars(rating)}
                </div>

            </div>

            <div class="section">

                <h3>
                    🛒 재료
                </h3>

                <ul class="ingredients">
                    ${ingredients}
                </ul>

            </div>

            <div class="section">

                <h3>
                    👨‍🍳 조리 방법
                </h3>

                <div class="instructions">
                    ${instructions.replace(/\n/g,"<br>")}
                </div>

            </div>

        </div>

    `;
}

async function getMeal() {

    const recipeCard =
        document.getElementById("recipeCard");

    recipeCard.innerHTML = `

        <div class="loading-card">

            <div class="loader"></div>

            <p>
                셰프가 메뉴를 준비하고 있습니다...
            </p>

        </div>

    `;

    try {

        const res =
            await fetch(
                "https://www.themealdb.com/api/json/v1/1/random.php"
            );

        const data =
            await res.json();

        const meal =
            data.meals[0];

        currentMeal = meal;
        currentRating = 0;

        const translatedName =
            await translate(
                meal.strMeal
            );

        currentTranslatedName =
            translatedName;

        await showMeal(
            meal,
            translatedName,
            0
        );

    } catch (err) {

        recipeCard.innerHTML = `

            <div class="loading-card">

                <p>
                    ❌ 메뉴를 불러오지 못했습니다.
                </p>

            </div>

        `;

        console.error(err);
    }
}

window.onload = () => {

    renderBookmarks();

    getMeal();

};
