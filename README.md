# Dauyan Modules
大宇言前端库


## About Code

## File Structure

* `bin` :  yarn scripts entry

* `packages` :  use as npm packages

* `app` :  pages for website, develop, doc etc.

* `.husky` :  husky scripts


### Scripts
* create workspaces

```
yarn create-workspace [package-name]
```

如

```
yarn create-workspace @dauyan/h5-ai-core
yarn

```

```
yarn create-workspace @dauyan/story app
yarn
```

### Develop
`nodejs` 20

```shell
npm install -g yarn
corepack enable
yarn
yarn start:dev
```
