import httpx


class GraphService:

    GRAPH_URL = "https://graph.microsoft.com/v1.0"

    @staticmethod
    async def get_me(access_token: str):

        headers = {
            "Authorization": f"Bearer {access_token}"
        }

        async with httpx.AsyncClient() as client:

            response = await client.get(
                f"{GraphService.GRAPH_URL}/me",
                headers=headers
            )

        if response.status_code != 200:
            raise Exception(response.text)

        return response.json()

    @staticmethod
    async def send_email(
        access_token: str,
        recipient: str,
        subject: str,
        html_body: str
    ):

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        payload = {
            "message": {

                "subject": subject,

                "body": {
                    "contentType": "HTML",
                    "content": html_body
                },

                "toRecipients": [
                    {
                        "emailAddress": {
                            "address": recipient
                        }
                    }
                ]
            },

            "saveToSentItems": True
        }

        async with httpx.AsyncClient() as client:

            response = await client.post(
                f"{GraphService.GRAPH_URL}/me/sendMail",
                headers=headers,
                json=payload
            )

        if response.status_code != 202:
            raise Exception(response.text)

        return {
            "message": "Email Sent Successfully"
        }

    @staticmethod
    async def send_email_with_attachment(
        access_token: str,
        recipient: str,
        subject: str,
        html_body: str,
        filename: str,
        file_content_base64: str,
        mime_type: str
    ):

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        payload = {
            "message": {

                "subject": subject,

                "body": {
                    "contentType": "HTML",
                    "content": html_body
                },

                "toRecipients": [
                    {
                        "emailAddress": {
                            "address": recipient
                        }
                    }
                ],

                "attachments": [
                    {
                        "@odata.type": "#microsoft.graph.fileAttachment",

                        "name": filename,

                        "contentType": mime_type,

                        "contentBytes": file_content_base64
                    }
                ]
            },

            "saveToSentItems": True
        }

        async with httpx.AsyncClient() as client:

            response = await client.post(
                f"{GraphService.GRAPH_URL}/me/sendMail",
                headers=headers,
                json=payload
            )

        if response.status_code != 202:
            raise Exception(response.text)

        return {
            "message": "Email Sent Successfully"
        }

    @staticmethod
    async def get_mail_folders(access_token: str):

        headers = {
            "Authorization": f"Bearer {access_token}"
        }

        async with httpx.AsyncClient() as client:

            response = await client.get(
                f"{GraphService.GRAPH_URL}/me/mailFolders",
                headers=headers
            )

        if response.status_code != 200:
            raise Exception(response.text)

        return response.json()