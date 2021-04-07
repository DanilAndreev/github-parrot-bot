<a href="#">
    <div align="center">
        <img alt="Ape Lang Logo" height="250" src="https://github.com/DanilAndreev/github-tracker-telegram-bot/blob/master/media/bot-logo.svg"/>
    </div>
    <div align="center">
        <h1>GitHub Parrot</h1>
    </div>
    <div align="center">
        <img alt="GitHub" src="https://img.shields.io/github/license/DanilAndreev/github-tracker-telegram-bot"/>
        <img alt="GitHub issues" src="https://img.shields.io/github/issues-raw/DanilAndreev/github-tracker-telegram-bot">
        <img alt="GitHub top language" src="https://img.shields.io/github/languages/top/DanilAndreev/github-tracker-telegram-bot">
        <img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr/DanilAndreev/github-tracker-telegram-bot">
    </div>   
</a>

# Overview
GitHub Parrot Bot - telegram bot for tracking GitHub repository events, such as:
- Issues
- Pull request
- Check suits.
- Check runs.

Also, you can connect your GitHub username to telegram username and bot will tag you if issue ot pull request refers to you.

## Why GitHub Parrot?
Because it uses webhooks to get updates. __No OAuth and right privileges!__. Just safe webhooks. Sounds good, right? :smiley: 

# Getting started
## Inviting the bot to Telegram chat
To connect the bot to Telegram chat follow steps:
1. Open the chat where you want to add the bot.
2. Open chat settings.
3. Press the __Add Memeber__ button.
4. Find bot using tag ```@GitHubIssuesPullsTrackingBot```.
5. Add the bot.
6. Give the bot rights to delete messages.

## Connecting bot to the __GitHub__ repository
So, when you have added the bot to your telegram chat - it's time to add repository for tracking. One chat can be connected to several repositories as well as one repository to several chats.  
To add the repository link follow steps:
1. Come up with the secret word. Is can be any word from 4 to 255 symbols.
2. Use next command in your Telegram chat to create a repository link: 
  ```
  /add <repository name> <your secret word>
  ```
  Example:
  ```
  /add "octocat/hello-worId" hellodarkness
  ```
3. Now move to your GitHub repository.
4. Open repository setting and go to the __Webhooks__ section.
5. Press __Add webhook__.
6. Set the __Payload URL__ field to: ``` here will be url ```.
7. Set the __Content type__ field to: ```application/json```!
8. Fill the __Secret__ field with your secret word.
9. Select webhook events or select ```send me everything``` option.
10. Ensure that the __Active__ flag is checked.
11. Press __Add webhook__ button.

## Adding your GitHub nickname to bot:
When you have connected your repository you can create link between your Telegram and GitHub accounts. It means, that when bot sends updates it will tag you in chat if you are related to the issue or pull request. That called ```AKA```.  
To create AKA use following command in the chat:
```
/connect <github username>
```
Example:
```
/connect Octocat
```
Now, bot can tag you on new information updates.

## Congratulations
Congratulations, you have made basic bot setup and now you can track repository updates. Hope, you are pleased :smiley:.

## What's next
Now your GitHub repository issues, pull requests and other will appear in Telegram chat. :bell:

## Giving rights
[instruction how to give bot rights]

# For developers | Source usage
You can find information about source code usage in [Wiki](https://github.com/DanilAndreev/github-parrot-bot/wiki).  
Also, you can find short information in source code directories using ```README.md``` files. 

# Author :ghost:
Danil Andreev | https://github.com/DanilAndreev | danssg08@gmail.com
