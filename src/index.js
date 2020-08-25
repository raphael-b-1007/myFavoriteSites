// import login from './utils/login';
import './app.scss';

const defaultSearch = 'love';
let searchString = defaultSearch;
let timeout;
let hideListItems = true;

const init = async () => {
    try {
        await chayns.ready;
        getData();
        if (chayns.env.user.isAuthenticated) {
            setName();
        }
        chayns.ui.initAll();
        const inputs = document.querySelectorAll('.form-item');
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].addEventListener('input', checkForText);
        }
        document.querySelector('#send').addEventListener('click', sendForm);
        document.querySelector('.accordion').addEventListener('click', accordionClicked);
        document.querySelector('#search').addEventListener('input', searchInput);
        document.querySelector('#toggle').addEventListener('click', toggleList);
    } catch (err) {
        console.error('No chayns environment found', err);
    }
};

const $list = document.querySelector('.list');

const getData = () => {
    document.querySelector('.accordion').classList.add('hidden');
    chayns.showWaitCursor();
    while ($list.firstElementChild !== null) {
        $list.firstElementChild.remove();
    }
    fetch(`https://chayns1.tobit.com/TappApi/Site/SlitteApp?SearchString=${searchString}&Skip=0&Take=60`)
        .then(function (response) {
            return response.json();
        }).then(function (json) {
            console.log('parsed json', json);
            createList(json.Data);
        }).catch(function (ex) {
            console.log('parsing failed', ex);
            chayns.hideWaitCursor();
        })
        .then(function () {
            document.querySelector('.accordion').classList.remove('hidden');
            chayns.hideWaitCursor();
            toggleList();
        });
};

const setName = () => {
    document.querySelector('#firstName').value = chayns.env.user.firstName;
    document.querySelector('#lastName').value = chayns.env.user.lastName;
    checkForText();
};

const searchInput = () => {
    clearTimeout(timeout);
    timeout = setTimeout(search, 500);
};

const search = () => {
    if (document.querySelector('#search').value === '') {
        searchString = defaultSearch;
    } else {
        searchString = document.querySelector('#search').value;
    }
    getData();
};

const toggleList = () => {
    const items = $list.children;
    if (hideListItems) {
        for (let i = 30; i < items.length; i++) {
            items[i].classList.add('hidden');
        }
        document.querySelector('#toggle').innerHTML = 'Mehr';
        hideListItems = false;
    } else {
        for (let i = 30; i < items.length; i++) {
            items[i].classList.remove('hidden');
        }
        document.querySelector('#toggle').innerHTML = 'Weniger';
        hideListItems = true;
    }
};

function createList(data) {
    for (const website of data) {
        const element = document.createElement('div');
        const name = document.createElement('p');
        const background = document.createElement('div');
        const img = document.createElement('div');

        element.classList.add('listElement');
        name.innerHTML = website.appstoreName.substr(0, 15);
        background.classList.add('background');
        img.style = `background-image: url(https://sub60.tobit.com/l/${website.locationId}?size=70); z-index: 1000; width: 70px; height: 70px;`;
        element.addEventListener('click', () => { chayns.openUrlInBrowser(`https://chayns.net/${website.siteId}`); });

        $list.appendChild(element);
        element.appendChild(background);
        background.appendChild(img);
        element.appendChild(name);
    }
}

const checkForText = () => {
    const divs = document.querySelectorAll('.input-group');
    for (let i = 0; i < divs.length; i++) {
        if (divs[i].firstElementChild.value === '') {
            divs[i].classList.remove('labelRight');
        } else {
            divs[i].classList.add('labelRight');
        }
    }
    if (document.querySelector('#firstName').value === '') {
        document.querySelector('#firstName').classList.add('wrong');
        document.querySelector('#firstName-label').classList.add('wrong');
    } else {
        document.querySelector('#firstName').classList.remove('wrong');
        document.querySelector('#firstName-label').classList.remove('wrong');
    }
    if (document.querySelector('#lastName').value === '') {
        document.querySelector('#lastName').classList.add('wrong');
        document.querySelector('#lastName-label').classList.add('wrong');
    } else {
        document.querySelector('#lastName').classList.remove('wrong');
        document.querySelector('#lastName-label').classList.remove('wrong');
    }
    if (document.querySelector('#eMail').value === '') {
        document.querySelector('#eMail').classList.add('wrong');
        document.querySelector('#eMail-label').classList.add('wrong');
    } else {
        document.querySelector('#eMail').classList.remove('wrong');
        document.querySelector('#eMail-label').classList.remove('wrong');
    }
    if (document.querySelector('#siteName').value === '') {
        document.querySelector('#siteName').classList.add('wrong');
        document.querySelector('#siteName-label').classList.add('wrong');
    } else {
        document.querySelector('#siteName').classList.remove('wrong');
        document.querySelector('#siteName-label').classList.remove('wrong');
    }
};

function accordionClicked() {
    if (!chayns.env.user.isAuthenticated) {
        chayns.addAccessTokenChangeListener(setName);
        chayns.login();
    }
}

function sendForm() {
    const $firstName = document.querySelector('#firstName');
    const $lastName = document.querySelector('#lastName');
    const $eMail = document.querySelector('#eMail');
    const $address = document.querySelector('#address');
    const $postcode = document.querySelector('#postcode');
    const $place = document.querySelector('#place');
    const $siteName = document.querySelector('#siteName');
    const $comment = document.querySelector('#comment');
    let message = '';
    let fullAddress = '';
    if ($address.value !== '' || $postcode.value !== '' || $place.value !== '') {
        fullAddress = `${$address.value}, ${$postcode.value} ${$place.value}`;
    }
    const personalData = `${$firstName.value} ${$lastName.value}: ${$eMail.value}`;
    if (fullAddress === '') {
        if ($comment.value === '') {
            message = `${personalData} \n hat ${$siteName.value} vorgeschlagen`;
        } else {
            message = `${personalData} \n hat ${$siteName.value} vorgeschlagen \n "${$comment.value}"`;
        }
    } else if ($comment.value === '') {
        message = `${personalData} \n ${fullAddress} \n hat ${$siteName.value} vorgeschlagen`;
    } else {
        message = `${personalData} \n ${fullAddress} \n hat ${$siteName.value} vorgeschlagen \n "${$comment.value}"`;
    }
    if ($firstName.value === '' || $lastName.value === '' || $eMail.value === '' || $siteName.value === '') {
        chayns.dialog.alert('', 'Bitte fülle alle Pflichtfelder aus.');
    } else {
        chayns.intercom.sendMessageToPage(
            {
                text: message
            }
        ).then(function (result) {
            if (result.ok) {
                chayns.dialog.alert('', 'Die Nachricht wurde versendet.');
                $firstName.value = '';
                $lastName.value = '';
                $eMail.value = '';
                $address.value = '';
                $postcode.value = '';
                $place.value = '';
                $siteName.value = '';
                $comment.value = '';
                checkForText();
            } else {
                chayns.dialog.alert('', 'Ein Fehler ist aufgetreten.');
            }
        });
    }
}

init();
