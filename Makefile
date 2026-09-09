# Makefile. https://www.gnu.org/software/make/

# Use ZSH/Bash instead of Bourne Shell
SHELL := $(shell which zsh 2>/dev/null || which bash 2>/dev/null)
.SHELLFLAGS := -c

git_current_branch ?= $$(git branch | grep '^*' | cut '-d*' -f2)

# Add Git remotes
.PHONY: git.add-remotes
git.add-remotes:
	git remote add github   git@github.com:joeljuca/pi-explabs.git         || true
	git remote add codeberg ssh://git@codeberg.org/joeljuca/pi-explabs.git || true

	for r in $$(git remote); do \
		; git fetch $$r \
	; done

# Pushes current branch to all Git remotes
.PHONY: git.push
git.push:
	for r in $$(git remote); do git push $$r $(git_current_branch); done

# Pushes all tags to all Git remotes
.PHONY: git.push-tags
git.push-tags:
	for t in $$(git tag); do for r in $$(git remote); do git push $$r $$t; done; done
