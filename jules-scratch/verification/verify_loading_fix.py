
from playwright.sync_api import sync_playwright, Page, expect

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            # Go to the homepage
            page.goto("http://localhost:8080/", timeout=60000)

            # 1. Wait for the loading indicator to disappear
            loading_indicator = page.locator(".animate-spin")
            expect(loading_indicator).not_to_be_visible(timeout=15000)

            # 2. Verify the dialog is visible
            dialog_locator = page.locator("text=Welcome to Ritvik's Portfolio")
            expect(dialog_locator).to_be_visible(timeout=10000)

            # 3. Take a screenshot
            page.screenshot(path="jules-scratch/verification/dialog_visible_after_load.png")

        finally:
            browser.close()

if __name__ == "__main__":
    main()
