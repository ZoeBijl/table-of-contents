// Prepend with javascript:
(()=>{
    let headings = document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]');
    let containerId = 'toc-bookmarklet';
    let tocActivated = document.getElementById(containerId) ? true : false;
    let hideHidden = true;

    if (headings.length && tocActivated === false) {
        let headingsList = [];
        let containerHeadingId = `${containerId}-heading`;
        
        // Separating the styles for readability
        let styles = document.createElement('style');
        styles.setAttribute('type', 'text/css');
        styles.setAttribute('title', 'Table of Contents Bookmarklet');

        // Container as dialog for accessibility
        let container = document.createElement('div');
        container.id = containerId;
        container.setAttribute('role', 'dialog');
        container.setAttribute('aria-labelledby', containerHeadingId);
        container.setAttribute('tabindex', '-1');
        
        let containerHeader = document.createElement('header');

        // Heading to provide an accessible name
        let containerHeading = document.createElement('h1');
        containerHeading.setAttribute('id', containerHeadingId);
        containerHeading.innerText = 'Table of Contents';
        containerHeader.appendChild(containerHeading);

        // Close button to, eh, close?
        let closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.textContent = 'x';
        closeButton.setAttribute('aria-label', 'Close ToC');
        // It would be nice to return focus to the trigger
        // But you can’t return to browser chrome buttons…
        closeButton.addEventListener('click', () => container.remove());
        
        // List element for results
        let list = document.createElement('ol');
        list.id = `${containerId}-list`;
        
        // Escape support
        let globalEscapeBound = globalEscape.bind(this);
        document.addEventListener('keydown', globalEscapeBound);
        function removeGlobalListener() {
            document.removeEventListener('keydown', globalEscapeBound);
        }
        function globalEscape(event) {
            if (event.key === 'Escape' || event.key === 'Esc') {
                container.remove();
                removeGlobalListener();
            }
        }

        containerHeader.appendChild(closeButton);
        container.appendChild(containerHeader);
        
        let intro = document.createElement('p');
        intro.innerText = 'H# for HTML, A# for ARIA.';
        container.appendChild(intro);
        
        let settings = document.createElement('div');
        let label = document.createElement('label');
        let labelText = document.createTextNode('Hide hidden headings');
        let checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.setAttribute('role', 'switch');
        checkbox.checked = hideHidden;
        checkbox.addEventListener('change', settingsChange);
        label.appendChild(checkbox);
        label.appendChild(labelText);
        settings.appendChild(label);
        container.appendChild(settings);
        
        function settingsChange() {
            hideHidden = checkbox.checked;
            removeHeadingList();
            generateHeadingList();
            addHeadingList();
        }
        
        function removeHeadingList() {
            let headingListElement = document.getElementById(list.id);
            if (headingListElement) {
                list.innerHTML = null;
                headingListElement.remove();
            }
        }
        
        function addHeadingList() {
            container.appendChild(list);
        }

        // Generate object with headings
        headings.forEach(heading => getHeadingInfo(heading));
        
        function getHeadingInfo(heading) {
            let role = heading.getAttribute('role');
            let text = heading.textContent.trim();
            let nodeName = heading.nodeName;
            let level, type, id;
            let hidden = checkHeadingVisibility(heading);
            
            if (heading[Symbol.toStringTag] === 'HTMLHeadingElement') {
                type = 'HTML';
                // heading.nodeName is in the format of 'h1', 'h2', etc, this checks the second part
                // This script doesn’t support HTML headings with aria-level set (which you shouldn’t do anyway)
                level = heading.nodeName[1];
            }

            if (role === 'heading') {
                type = 'ARIA';
                level = heading.getAttribute('aria-level');
            }
            
            if (heading.id) {
                id = heading.id;
            }
            
            headingsList.push({type: type, level: level, text: text, nodeName: nodeName, id: id, hidden: hidden})
        };
        
        function checkHeadingVisibility(heading) {
            let { length } = heading.getClientRects();
            let visibility = window.getComputedStyle(heading).visibility === 'hidden';
            let ariaHidden = heading.closest('[aria-hidden]') != null;
            let inert = heading.closest('[inert]') != null;
            let hidden = length === 0 || visibility === true || ariaHidden === true || inert === true;
            return hidden;
        };
        
        function filterHiddenHeadings(item) {
            if (item.hidden === true) {
                return false;
            }
            return true;
        }
        
        function generateHeadingList() {
            if (document.getElementById(list.id)) {
                removeHeadingList();
            }

            if (hideHidden) {
                let filtered = headingsList.filter(filterHiddenHeadings);
                filtered.forEach(heading => createHeadingListItem(heading));
                return;
            }

            headingsList.forEach(heading => createHeadingListItem(heading));
        }
        
        generateHeadingList();
        
        function createHeadingListItem(heading) {
            let listItem = document.createElement('li');
            let dashes = '–'.repeat(heading.level);
            let headingTextNode = document.createTextNode(heading.text);
            let type = heading.type === 'ARIA' ? 'A' : 'H';
            listItem.innerText = `${dashes} ${type}${heading.level}: `;
            
            if (heading.id) {
                let link = document.createElement('a');
                link.href = `#${heading.id}`;
                link.innerText = heading.text;
                
                headingTextNode = link;
            }
            
            listItem.appendChild(headingTextNode);
            list.appendChild(listItem);
        };
        
        // Place button on “correct” side for Mac users
        let mac = navigator.appVersion.indexOf('Mac') != -1 ? true : false;
        let macButton = mac ? 'grid-area: macButton;' : '';

        styles.innerText = 
            `#${containerId} {
                display: inline-block;
                position: fixed;
                top: 0;
                left: 0;
                z-index: 9999;
                margin: 0.5em;
                padding: 0 .5em;
                max-width: calc(100% - 1em);
                max-height: calc(100% - 1em);
                border: .0625em solid rgba(0,0,0,.3);
                border-radius: .25em;
                box-shadow: 0 .25em .5em rgba(0,0,0,.3);
                overflow-y: auto;
                color: black;
                font-family: sans-serif;
                font-size: max(1em, 16px);
                line-height: 1.5;
                background-color: white;
            }

            #${containerId}:focus-visible, 
            #${containerId} :focus {
                outline: 2px solid transparent;
                box-shadow: 
                    0 0 0 .125em white,
                    0 0 0 .25em hsl(260, 30%, 53%),
                    0 .25em .5em rgba(0,0,0,.3);
            }

            #${containerId} header {
                display: grid;
                grid-template-columns: 1.5em auto 1.5em;
                grid-template-areas: 'macButton heading button';
                grid-gap: .5em;
                width: calc(100% + 1em);
                margin: 0 -.5em;
                padding: .5em;
                border-bottom: .0625em solid rgba(0,0,0,.3);
            }

            #${containerId} h1 {
                margin: 0;
                font-family: inherit;
                font-size: 1em;
                font-weight: bold;
                line-height: inherit;
                text-align: center;
                grid-area: heading;
            }
            #${containerId} button {
                width: 1.5em;
                height: 1.5em;
                grid-area: button;
                ${macButton}
                border: 1px solid #605a6d;
                border-radius: 5px;
                box-shadow: 0 1px 2px #403b44;
                color: #fff;
                font-family: inherit;
                font-size: inherit;
                text-shadow: 0 -1px 1px #403b44;
                background-color: #7f6699;
                background-image: linear-gradient(to bottom, #866f9f, #776090);
                cursor:pointer;
            }
            #${containerId} a {
                color: hsl(260, 30%, 53%);
            }
            #${containerId} ol {
                list-style-position: inside;
                list-style-type: none;
                margin: 1em 0;
                padding: 0;
            }`;
        
        addHeadingList();
        
        document.head.appendChild(styles);
        document.body.appendChild(container);
        container.focus();
    }
})();