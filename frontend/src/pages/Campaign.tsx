
import React from 'react'
import Sidebar from './Sidebar'

const Campaign = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Campaigns
            </h1>

            <p className="mt-1 text-gray-500">
              Create, manage and monitor your email campaigns.
            </p>
          </div>

          <button className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800">
            + Create Campaign
          </button>
        </div>


        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 mb-8">

          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">
              Total Campaigns
            </p>

            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              24
            </h2>
          </div>


          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">
              Running
            </p>

            <h2 className="mt-2 text-3xl font-bold text-blue-600">
              3
            </h2>
          </div>


          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">
              Completed
            </p>

            <h2 className="mt-2 text-3xl font-bold text-green-600">
              18
            </h2>
          </div>


          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">
              Failed
            </p>

            <h2 className="mt-2 text-3xl font-bold text-red-600">
              3
            </h2>
          </div>

        </div>


        {/* Campaign List */}
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm">

          {/* Table Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-5">

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Your Campaigns
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                View and manage your email campaigns.
              </p>
            </div>

            <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Filter
            </button>

          </div>


          {/* Table */}
          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-gray-50 text-sm text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-medium">
                    Campaign
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Recipients
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Sent
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Opened
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Status
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Action
                  </th>
                </tr>
              </thead>


              <tbody className="divide-y divide-gray-100">

                <tr className="hover:bg-gray-50">

                  <td className="px-6 py-5">
                    <div>
                      <p className="font-medium text-gray-900">
                        Summer Promotion
                      </p>

                      <p className="text-sm text-gray-500">
                        Created Aug 10, 2026
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-gray-700">
                    2,450
                  </td>

                  <td className="px-6 py-5 text-gray-700">
                    2,450
                  </td>

                  <td className="px-6 py-5 text-gray-700">
                    1,240
                  </td>

                  <td className="px-6 py-5">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      Completed
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <button className="text-sm font-medium text-gray-700 hover:text-black">
                      View
                    </button>
                  </td>

                </tr>


                <tr className="hover:bg-gray-50">

                  <td className="px-6 py-5">
                    <div>
                      <p className="font-medium text-gray-900">
                        Product Launch
                      </p>

                      <p className="text-sm text-gray-500">
                        Created Aug 11, 2026
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-gray-700">
                    5,200
                  </td>

                  <td className="px-6 py-5 text-gray-700">
                    3,100
                  </td>

                  <td className="px-6 py-5 text-gray-700">
                    1,540
                  </td>

                  <td className="px-6 py-5">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                      Running
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <button className="text-sm font-medium text-gray-700 hover:text-black">
                      View
                    </button>
                  </td>

                </tr>


                <tr className="hover:bg-gray-50">

                  <td className="px-6 py-5">
                    <div>
                      <p className="font-medium text-gray-900">
                        Newsletter August
                      </p>

                      <p className="text-sm text-gray-500">
                        Created Aug 8, 2026
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-gray-700">
                    1,800
                  </td>

                  <td className="px-6 py-5 text-gray-700">
                    1,800
                  </td>

                  <td className="px-6 py-5 text-gray-700">
                    920
                  </td>

                  <td className="px-6 py-5">
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                      Failed
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <button className="text-sm font-medium text-gray-700 hover:text-black">
                      View
                    </button>
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </div>

      </main>

    </div>
  )
}

export default Campaign