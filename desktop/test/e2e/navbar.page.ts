import { click, getLocator, waitForExist, getText } from './app';


export class NavbarPage {

    // click

    public static clickTab(tabName: string) {

        return click('#navbar-' + tabName);
    }


    public static clickCloseNonResourcesTab() {

        return click('#non-resources-tab .btn');
    }


    public static clickConflictsButton() {

        return click('#taskbar-conflicts-button');
    }


    public static clickConflictResolverLink(identifier: string) {

        return click('#taskbar-conflict-' + identifier);
    }


    public static async clickUsernameButton() {

        return click(await this.getUsernameButton());
    }x


    public static async clickSelectProject(option) {

        await waitForExist('#projectSelectBox');
        const element = (await getLocator('#projectSelectBox option')).nth(option);
        return click(element);
    }


    public static async clickCloseAllMessages() {

        await waitForExist((await getLocator('.alert button')).nth(0));
        const elements = await getLocator('.alert button');
        for (let i = 0; i < await elements.count(); i++) {
            await elements.nth(i).click();
        }
    }


    // await

    public static awaitAlert(text: string, matchExactly: boolean = true) {

        if (matchExactly) {
            return waitForExist("//span[@class='message-content' and normalize-space(text())='" + text + "']");
        } else {
            return waitForExist("//span[@class='message-content' and contains(text(),'" + text + "')]");
        }
    };


    // elements

    public static getTab(routeName: string, resourceIdentifier?: string) {

        return getLocator('#navbar-' + routeName + (resourceIdentifier ? '-' + resourceIdentifier : ''));
    }


    public static getUsernameButton() {

        return getLocator('#username');
    }


    // get text

    public static async getMessageText() {

        return getText('#message-0');
    }


    public static async getActiveNavLinkLabel() {

        return getText('#navbarSupportedContent .active .nav-link');
    }


    public static async getTabLabel(routeName: string, resourceIdentifier?: string) {

        return getText(await this.getTab(routeName, resourceIdentifier));
    }

    
    public static async getUsername() {

        return getText(await this.getUsernameButton());
    }
}
