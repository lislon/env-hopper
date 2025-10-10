import { screen, waitFor } from '@testing-library/react'
import { expect } from 'vitest'
import type { RenderResult } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

export function createResourceJumpUI(_result: RenderResult, user: UserEvent) {
  const collectNonEmptyButtonLabels = (root: ParentNode): Array<string> => {
    const buttons = Array.from(root.querySelectorAll('button'))
    return buttons
      .map((b) => (b.textContent || '').trim())
      .filter((t) => t.length > 0 && t !== 'Empty')
  }

  // env panel will be resolved by test id at call site

  return {
    env: {
      select: async (envSlug: string) => {
        // Find the environment combobox input
        const envInput = screen.getByRole('combobox', { name: /environment/i })

        // Click to open the dropdown
        await user.click(envInput)

        // Wait for dropdown to appear and find the option
        await waitFor(async () => {
          try {
            const option = screen.getByRole('option', {
              name: new RegExp(envSlug, 'i'),
            })
            await user.click(option)
          } catch {
            // Get all available options for error message
            const allOptions = screen.getAllByRole('option')
            const availableSlugs = allOptions
              .map((opt) => opt.textContent)
              .filter(Boolean)
            throw new Error(
              `Environment '${envSlug}' not found. Available: ${availableSlugs.join(', ')}`,
            )
          }
        })
      },

      getSelectedTitle: () => {
        const envInput = screen.getByRole('combobox', { name: /environment/i })
        return (
          envInput.getAttribute('value') || envInput.textContent || undefined
        )
      },
    },

    parameters: {
      getInput: async (labelText: string) => {
        return await screen.findByPlaceholderText(new RegExp(labelText, 'i'))
      },
    },

    quickBar: {
      clickFirst: async () => {
        const section = await screen.findByTestId('quick-jump-section')
        await waitFor(() => {
          expect(section.querySelector('button')).not.toBeNull()
        })
        const first = section.querySelector('button')
        if (!first) {
          throw new Error('No quick bar buttons found')
        }
        await user.click(first)
      },
      clickApp: async (labelText: string) => {
        const section = await screen.findByTestId('quick-jump-section')
        const buttons = Array.from(section.querySelectorAll('button'))
        const target = buttons.find((btn) =>
          (btn.textContent || '')
            .toLowerCase()
            .includes(labelText.toLowerCase()),
        )
        if (!target) {
          const labels = buttons.map((b) => b.textContent || '').join(', ')
          throw new Error(
            `Quick bar app '${labelText}' not found. Available: ${labels}`,
          )
        }
        await user.click(target)
      },
    },

    quickSlots: {
      async getAppSlots(): Promise<Array<string>> {
        const section = await screen.findByTestId('quick-jump-section')
        return collectNonEmptyButtonLabels(section)
      },
      async getEnvSlots(): Promise<Array<string>> {
        const envPanel = await screen.findByTestId('env-quick-jump-section')
        return collectNonEmptyButtonLabels(envPanel)
      },
    },

    resource: {
      select: async (resourceSlug: string) => {
        // Find the resource combobox input (second combobox)
        const comboboxes = screen.getAllByRole('combobox')
        const resourceInput = comboboxes[1] // Assuming resource selector is the second combobox

        if (!resourceInput) {
          throw new Error('Resource combobox not found')
        }

        // Click to open the dropdown
        await user.click(resourceInput)

        // Wait for dropdown to appear and find the option
        await waitFor(async () => {
          try {
            const option = screen.getByRole('option', {
              name: new RegExp(resourceSlug, 'i'),
            })
            await user.click(option)
          } catch {
            // Get all available options for error message
            const allOptions = screen.getAllByRole('option')
            const availableSlugs = allOptions
              .map((opt) => opt.textContent)
              .filter(Boolean)
            throw new Error(
              `Resource '${resourceSlug}' not found. Available: ${availableSlugs.join(', ')}`,
            )
          }
        })
      },

      getSelectedTitle: () => {
        const comboboxes = screen.getAllByRole('combobox')
        const resourceInput = comboboxes[1]
        if (!resourceInput) return undefined
        return (
          resourceInput.getAttribute('value') ||
          resourceInput.textContent ||
          undefined
        )
      },
    },

    jump: {
      getState: () => {
        const jumpButton = screen.queryByTestId('jump-main-button')
        if (!jumpButton) {
          return { url: undefined, text: undefined }
        }

        // Extract URL from href attribute if it's a link
        const url = jumpButton.getAttribute('href') || undefined

        // Get full text content
        const text = jumpButton.textContent || undefined

        return { url, text }
      },
      getUrl: () => {
        const jumpButton = screen.queryByTestId('jump-main-button')
        return jumpButton?.getAttribute('href') || undefined
      },
    },
  }
}
